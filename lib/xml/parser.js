"use strict";

const parseXMLString = require("xml2js").parseString;
const nodefn = require("when/node");
const ICAL = require("ical.js");

// parse calendar object
function parseCalendarMultistatus(xml) {
    return nodefn.call(parseXMLString, xml).then((result) => {
        const parsed = {};

        if (!result["d:multistatus"] || !result["d:multistatus"]["d:response"]) {
            return parsed;
        }

        parsed.href = result["d:multistatus"]["d:response"][0]["d:href"][0];
        parsed.name = result["d:multistatus"]["d:response"][0]["d:propstat"][0]["d:prop"][0]["d:displayname"][0];
        parsed.ctag = result["d:multistatus"]["d:response"][0]["d:propstat"][0]["d:prop"][0]["cs:getctag"][0];

        return parsed;
    });
}

// parse events
function parseEventsMultistatus(xml) {
    let parsed;
    const formatted = [];

    return nodefn.call(parseXMLString, xml).then((result) => {
        if (!result["d:multistatus"] || !result["d:multistatus"]["d:response"]) {
            return formatted;
        }

        parsed = result["d:multistatus"]["d:response"];

        // parse must not be undefined!
        parsed.forEach((event) => {
            // fix etag string (renders as '"[...]"', ugly xml2js objects (pew pew)
            let etag = event["d:propstat"][0]["d:prop"][0]["d:getetag"][0];

            etag = etag.substring(1, etag.length);

            formatted.push({
                ics: event["d:href"][0],
                etag
            });
        });

        return formatted;
    });
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

function getNormalOccurenceEventData(nextEvent, eventData, vevent) {
    const dtstart = nextEvent.startDate;
    const dtend = nextEvent.endDate;
    const { summary: title, uid, location, description } = nextEvent.item;

    return {
        title,
        uid,
        location,
        description,
        start: new Date(dtstart),
        end: new Date(dtend),
        duration: dtend.subtractDate(dtstart),
        type: { recurring: true, edited: false },
        createdAt: new Date(vevent.getFirstPropertyValue("created"))
    };
}

function getModifiedOccurenceEventData(vevent, eventData) {
    const dtstart = vevent.getFirstPropertyValue("dtstart");
    const dtend = vevent.getFirstPropertyValue("dtend");

    return {
        title: vevent.getFirstPropertyValue("summary"),
        uid: vevent.getFirstPropertyValue("uid"),
        location: vevent.getFirstPropertyValue("location"),
        description: vevent.getFirstPropertyValue("description"),
        start: new Date(dtstart),
        end: new Date(dtend),
        duration: dtend.subtractDate(dtstart),
        type: { recurring: true, edited: true },
        createdAt: new Date(vevent.getFirstPropertyValue("created"))
    };
}

function parseEvents(xml) {
    let parsed;
    const formatted = [];

    return nodefn.call(parseXMLString, xml).then((result) => {
        if (!result["d:multistatus"] || !result["d:multistatus"]["d:response"]) {
            return formatted;
        }

        parsed = result["d:multistatus"]["d:response"];

        parsed.forEach((event) => {
            let etag = event["d:propstat"][0]["d:prop"][0]["d:getetag"][0];

            etag = etag.substring(1, etag.length);

            let eventData = {};
            const calendarData = event["d:propstat"][0]["d:prop"][0]["cal:calendar-data"][0];
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
                                ics: event["d:href"][0],
                                etag,
                                data: getNormalOccurenceEventData(nextEvent, eventData, vevent)
                            });
                        } else {
                            // There are modified occurences
                            if (isModified(nextOccuranceTime, modifiedOccurences)) {
                                // This is the event that has been modied
                                const key = getModifiedOccuranceKey(nextOccuranceTime, modifiedOccurences) || 0;

                                formatted.push({
                                    ics: event["d:href"][0],
                                    etag,
                                    data: getModifiedOccurenceEventData(vevents[key], eventData)
                                });
                            } else {
                                // Expand this event normally
                                formatted.push({
                                    ics: event["d:href"][0],
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

                eventData = {
                    title: vevent.getFirstPropertyValue("summary"),
                    uid: vevent.getFirstPropertyValue("uid"),
                    location: vevent.getFirstPropertyValue("location"),
                    description: vevent.getFirstPropertyValue("description"),
                    start: new Date(dtstart),
                    end: new Date(dtend),
                    duration: dtend.subtractDate(dtstart),
                    type: { recurring: false, edited: false },
                    createdAt: new Date(vevent.getFirstPropertyValue("created"))
                };

                formatted.push({
                    ics: event["d:href"][0],
                    etag,
                    data: eventData
                });
            }
        });

        formatted.sort((a, b) => {
            const aStart = new ICAL.Time().fromJSDate(a.data.start);
            const bStart = new ICAL.Time().fromJSDate(b.data.start);

            return aStart.compare(bStart);
        });

        return formatted;
    });
}

exports.parseEventsMultistatus = parseEventsMultistatus;
exports.parseCalendarMultistatus = parseCalendarMultistatus;
exports.parseEvents = parseEvents;
