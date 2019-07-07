"use strict";

const { promisify } = require("util");
const xml2js = require("xml2js");
const ICAL = require("ical.js");
const moment = require("moment");

// setup XML parse so that it always generates a $ns for the elements and also strip the prefixes
// from the names. some servers (e.g. iCloud) use an empty prefix for the DAV namespace.
const parser = new xml2js.Parser({
    tagNameProcessors: [
        xml2js.processors.stripPrefix
    ],
    explicitCharkey: true,
    xmlns: true
});

// since the parser now generates $ns elements for all character elements,
// we want to fold those again. for example:
//
// from:
// "href": [{
//         "_": "/2342342342/calendars/DEAD2715-94D6-47E1-A2B6-BEEF15C93AC/",
//         "$ns": {
//             "uri": "DAV:",
//             "local": "href"
//         }
//     }
// ],
//
// into:
//
// "href": ["/2342342342/calendars/DEAD2715-94D6-47E1-A2B6-BEEF15C93AC/"],
//
//
function foldCharacterElements(xml) {
    if (typeof xml !== "object") {
        return xml;
    }
    if (Array.isArray(xml)) {
        return xml.map(foldCharacterElements);
    }
    if ("_" in xml) {
        return xml._;
    }
    Object.keys(xml).forEach((key) => {
        // strip away the $ns objects again
        if (key === "$" || key === "$ns") {
            delete xml[key];
        } else {
            xml[key] = foldCharacterElements(xml[key]);
        }
    });
    return xml;
}

function parseXMLString(xml) {
    return new Promise((resolve, reject) => {
        return promisify(parser.parseString)(xml)
            .then(foldCharacterElements)
            .then(resolve)
            .catch(reject);
    });
}

// parse calendar object
function parseCalendarMultistatus(xml) {
    return parseXMLString(xml).then((result) => {
        const parsed = {};

        if (!result.multistatus || !result.multistatus.response) {
            return parsed;
        }

        parsed.href = result.multistatus.response[0].href[0];
        parsed.name = result.multistatus.response[0].propstat[0].prop[0].displayname[0];
        parsed.ctag = result.multistatus.response[0].propstat[0].prop[0].getctag[0];

        return parsed;
    });
}

// parse events
function parseEventsMultistatus(xml) {
    let parsed;
    const formatted = [];

    return parseXMLString(xml).then((result) => {
        if (!result.multistatus || !result.multistatus.response) {
            return formatted;
        }

        parsed = result.multistatus.response;

        // parse must not be undefined!
        parsed.forEach((event) => {
            // fix etag string (renders as '"[...]"', ugly xml2js objects (pew pew)
            let etag = event.propstat[0].prop[0].getetag[0];

            etag = stripDoubleQuotes(etag);

            formatted.push({
                ics: event.href[0],
                etag
            });
        });

        return formatted;
    });
}

function stripDoubleQuotes(etag) {
    // etag is wrapped in double quotes e.g "edbc0fe050fc096e444756252c94c590"
    // returns etag without the double quotes
    return etag.slice(1, -1);
}

function isModified(occurence, modifiedOccurances) {
    return modifiedOccurances.some(modifiedOcc => {
        return modifiedOcc["recurrence-id"].compare(occurence) === 0;
    });
}

function getModifiedOccuranceKey(occurence, modifiedOccurances) {
    let key = null;

    modifiedOccurances.forEach(modifiedOcc => {
        if (modifiedOcc["recurrence-id"].compare(occurence) === 0) {
            key = modifiedOcc.key;
        }
    });

    return key;
}

function getNormalizedDuration(dtstart, dtend) {
    const duration = dtend.subtractDate(dtstart);

    delete duration.wrappedJSObject;

    return duration;
}

function getNormalizedEndDate(endDate, duration) {
    const allDayEvent = duration.days > 0 || duration.weeks > 0;

    // CalDav saves the end date of all day events as the start of the next day
    // To fix this, we subtract one second from the end date
    return allDayEvent ?
        moment(endDate).subtract(1, "seconds").toISOString() :
        endDate.toISOString();
}

function getNormalOccurenceEventData(nextEvent, eventData, vevent) {
    const dtstart = nextEvent.startDate;
    const dtend = nextEvent.endDate;
    const { summary: title, uid, location, description } = nextEvent.item;
    const duration = getNormalizedDuration(dtstart, dtend);

    return {
        title,
        uid,
        location,
        description,
        start: new Date(dtstart).toISOString(),
        end: getNormalizedEndDate(new Date(dtend), duration),
        duration,
        type: { recurring: true, edited: false },
        createdAt: new Date(vevent.getFirstPropertyValue("created")).toISOString()
    };
}

function getModifiedOccurenceEventData(vevent, eventData) {
    const dtstart = vevent.getFirstPropertyValue("dtstart");
    const dtend = vevent.getFirstPropertyValue("dtend");
    const duration = getNormalizedDuration(dtstart, dtend);

    return {
        title: vevent.getFirstPropertyValue("summary"),
        uid: vevent.getFirstPropertyValue("uid"),
        location: vevent.getFirstPropertyValue("location"),
        description: vevent.getFirstPropertyValue("description"),
        start: new Date(dtstart).toISOString(),
        end: getNormalizedEndDate(new Date(dtend), duration),
        duration,
        type: { recurring: true, edited: true },
        createdAt: new Date(vevent.getFirstPropertyValue("created")).toISOString()
    };
}

function parseEvents(xml) {
    let parsed;
    const formatted = [];

    return parseXMLString(xml).then((result) => {
        if (!result.multistatus || !result.multistatus.response) {
            return formatted;
        }

        parsed = result.multistatus.response;

        parsed.forEach((event) => {
            let etag = event.propstat[0].prop[0].getetag[0];

            etag = stripDoubleQuotes(etag);

            let eventData = {};
            const calendarData = event.propstat[0].prop[0]["calendar-data"][0];
            const jcalData = ICAL.parse(calendarData);
            const comp = new ICAL.Component(jcalData);
            const vevents = comp.getAllSubcomponents("vevent");
            const modifiedOccurences = [];

            vevents.forEach((evt, index) => {
                // If an event has a reccurence-id, it is a modified occurrence
                if (evt.getFirstPropertyValue("recurrence-id")) {
                    modifiedOccurences.push({
                        "recurrence-id": evt.getFirstPropertyValue("recurrence-id"),
                        key: index
                    });
                }
            });

            const vevent = comp.getFirstSubcomponent("vevent");
            const icalEvent = new ICAL.Event(vevent);

            if (icalEvent.isRecurring()) {
                // This is a recurring event, expand the next few occurances
                const expand = new ICAL.RecurExpansion({
                    component: vevent,
                    dtstart: vevent.getFirstPropertyValue("dtstart")
                });

                // Since there are infinite rules, its a good idea to limit the scope
                // of the iteration then resume later on
                // Expand upto a maximum of 10 upcoming occurances
                for (let i = 0; i < 10; i++) {
                    const nextOccuranceTime = expand.next();

                    if (!expand.complete) {
                        // Handle this next expanded occurence
                        const nextEvent = icalEvent.getOccurrenceDetails(nextOccuranceTime);

                        eventData = {};

                        if (modifiedOccurences.length === 0) {
                            // No events have been modified
                            formatted.push({
                                ics: event.href[0],
                                etag,
                                data: getNormalOccurenceEventData(nextEvent, eventData, vevent)
                            });
                        } else {
                            // There are modified occurences
                            if (isModified(nextOccuranceTime, modifiedOccurences)) {
                                // This is the event that has been modied
                                const key = getModifiedOccuranceKey(nextOccuranceTime, modifiedOccurences) || 0;

                                formatted.push({
                                    ics: event.href[0],
                                    etag,
                                    data: getModifiedOccurenceEventData(vevents[key], eventData)
                                });
                            } else {
                                // Expand this event normally
                                formatted.push({
                                    ics: event.href[0],
                                    etag,
                                    data: getNormalOccurenceEventData(nextEvent, eventData, vevent)
                                });
                            }
                        }
                    }
                }
            } else {
                // This is not a recurring event
                // It could be a multiple day event or a single day event
                const dtstart = vevent.getFirstPropertyValue("dtstart");
                const dtend = vevent.getFirstPropertyValue("dtend");
                const duration = getNormalizedDuration(dtstart, dtend);

                eventData = {
                    title: vevent.getFirstPropertyValue("summary"),
                    uid: vevent.getFirstPropertyValue("uid"),
                    location: vevent.getFirstPropertyValue("location"),
                    description: vevent.getFirstPropertyValue("description"),
                    start: new Date(dtstart).toISOString(),
                    end: getNormalizedEndDate(new Date(dtend), duration),
                    duration,
                    type: { recurring: false, edited: false },
                    createdAt: new Date(vevent.getFirstPropertyValue("created")).toISOString()
                };

                formatted.push({
                    ics: event.href[0],
                    etag,
                    data: eventData
                });
            }
        });

        // sort events by start date - ascending (older events first)
        formatted.sort((a, b) => new Date(a.data.start).getTime() - new Date(b.data.start).getTime());

        return formatted;
    });
}

exports.parseEventsMultistatus = parseEventsMultistatus;
exports.parseCalendarMultistatus = parseCalendarMultistatus;
exports.parseEvents = parseEvents;
