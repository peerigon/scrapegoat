const { promisify } = require("util");
const { parseString, processors } = require("xml2js");

const parseXMLString = promisify(parseString);
const ICAL = require("ical.js");
const moment = require("moment");

const PARSE_XML_CONFIG = { ignoreAttrs: true, tagNameProcessors: [processors.stripPrefix] };

// parse calendar object
function parseCalendarMultistatus(xml) {
    return parseXMLString(xml, PARSE_XML_CONFIG).then((result) => {
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

    return parseXMLString(xml, PARSE_XML_CONFIG).then((result) => {
        if (!result.multistatus || !result.multistatus.response) {
            return formatted;
        }

        parsed = result.multistatus.response;

        // parse must not be undefined!
        parsed.forEach((event) => {
            // fix etag string (renders as '"[...]"', ugly xml2js objects (pew pew)
            let etag = event.propstat[0].prop[0].getetag[0];

            etag = stripDoubleQuotes(etag);

            // filter out URL's that do not end in '.ics' (iCloud calendar returns those)
            if (event.href[0].endsWith(".ics")) {
                formatted.push({
                    ics: event.href[0],
                    etag,
                });
            }
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
        moment(endDate).subtract(1, "seconds")
            .toISOString() :
        endDate.toISOString();
}

function getNormalOccurenceEventData(nextEvent, vevent) {
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
        createdAt: new Date(vevent.getFirstPropertyValue("created")).toISOString(),
    };
}

function getModifiedOccurenceEventData(vevent) {
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
        createdAt: new Date(vevent.getFirstPropertyValue("created")).toISOString(),
    };
}

function parseEvents(xml, maxExpandCount, startDate = null, endDate = null) {
    let parsed;
    const formatted = [];

    return parseXMLString(xml, PARSE_XML_CONFIG).then((result) => {
        if (!result.multistatus || !result.multistatus.response) {
            return formatted;
        }

        parsed = result.multistatus.response;

        parsed.forEach((event) => {
            let etag = event.propstat[0].prop[0].getetag[0];

            etag = stripDoubleQuotes(etag);

            if (!event.propstat[0].prop[0]["calendar-data"]) {
                return;
            }

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
                        key: index,
                    });
                }
            });

            const vevent = comp.getFirstSubcomponent("vevent");
            const icalEvent = new ICAL.Event(vevent);

            if (icalEvent.isRecurring()) {
                const expand = new ICAL.RecurExpansion({
                    component: vevent,
                    dtstart: vevent.getFirstPropertyValue("dtstart"),
                });
                const startRange = startDate ? ICAL.Time.fromDateTimeString(moment(startDate).toISOString()) : null;
                const endRange = endDate ? ICAL.Time.fromDateTimeString(moment(endDate).toISOString()) : null;
                let occurrencesCount = 0;

                for (let next = expand.next(); next; next = expand.next()) {
                    // If max iteration count is reached: break
                    if (occurrencesCount >= maxExpandCount) {
                        break;
                    }

                    // If date is after end date: break
                    if (endRange && next.compare(endRange) > 0) {
                        break;
                    }

                    // If date is before start date: continue
                    if (startRange && next.compare(startRange) < 0) {
                        continue;
                    }

                    occurrencesCount += 1;

                    // Handle this next expanded occurence
                    const nextEvent = icalEvent.getOccurrenceDetails(next);

                    if (modifiedOccurences.length && isModified(next, modifiedOccurences)) {
                        // This event has been modified
                        const key = getModifiedOccuranceKey(next, modifiedOccurences);

                        formatted.push({
                            ics: event.href[0],
                            etag,
                            data: getModifiedOccurenceEventData(vevents[key]),
                        });
                    } else {
                        // Expand this event normally
                        formatted.push({
                            ics: event.href[0],
                            etag,
                            data: getNormalOccurenceEventData(nextEvent, vevent),
                        });
                    }
                }
            } else {
                // This is not a recurring event
                // It could be a multiple day event or a single day event
                const dtstart = vevent.getFirstPropertyValue("dtstart");
                const dtend = vevent.getFirstPropertyValue("dtend");
                const duration = getNormalizedDuration(dtstart, dtend);
                const eventData = {
                    title: vevent.getFirstPropertyValue("summary"),
                    uid: vevent.getFirstPropertyValue("uid"),
                    location: vevent.getFirstPropertyValue("location"),
                    description: vevent.getFirstPropertyValue("description"),
                    start: new Date(dtstart).toISOString(),
                    end: getNormalizedEndDate(new Date(dtend), duration),
                    duration,
                    type: { recurring: false, edited: false },
                    createdAt: new Date(vevent.getFirstPropertyValue("created")).toISOString(),
                };

                formatted.push({
                    ics: event.href[0],
                    etag,
                    data: eventData,
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
