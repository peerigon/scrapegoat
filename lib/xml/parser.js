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
                            const dtstart = nextEvent.startDate;
                            const dtend = nextEvent.endDate;

                            eventData.title = nextEvent.item.summary;
                            eventData.uid = nextEvent.item.uid;
                            eventData.location = nextEvent.item.location;
                            eventData.description = nextEvent.item.description;
                            eventData.start = new Date(dtstart);
                            eventData.end = new Date(dtend);
                            eventData.duration = dtend.subtractDate(dtstart);
                            eventData.type = { recurring: true, edited: false };
                            eventData.createdAt = new Date(vevent.getFirstPropertyValue("created"));

                            formatted.push({
                                ics: event["d:href"][0],
                                etag,
                                data: eventData
                            });
                        } else {
                            // There are modified occurences
                            if (isModified(nextOccuranceTime, modifiedOccurences)) {
                                // This is the event that has been modied
                                const key = getModifiedOccuranceKey(nextOccuranceTime, modifiedOccurences) || 0;
                                const dtstart = vevents[key].getFirstPropertyValue("dtstart");
                                const dtend = vevents[key].getFirstPropertyValue("dtend");

                                eventData.title = vevents[key].getFirstPropertyValue("summary");
                                eventData.uid = vevents[key].getFirstPropertyValue("uid");
                                eventData.location = vevents[key].getFirstPropertyValue("location");
                                eventData.description = vevents[key].getFirstPropertyValue("description");
                                eventData.start = new Date(dtstart);
                                eventData.end = new Date(dtend);
                                eventData.duration = dtend.subtractDate(dtstart);
                                eventData.type = { recurring: true, edited: true };
                                eventData.createdAt = new Date(vevents[key].getFirstPropertyValue("created"));

                                formatted.push({
                                    ics: event["d:href"][0],
                                    etag,
                                    data: eventData
                                });
                            } else {
                                // Expand this event normally
                                const dtstart = nextEvent.startDate;
                                const dtend = nextEvent.endDate;

                                eventData.title = nextEvent.item.summary;
                                eventData.uid = nextEvent.item.uid;
                                eventData.location = nextEvent.item.location;
                                eventData.description = nextEvent.item.description;
                                eventData.start = new Date(dtstart);
                                eventData.end = new Date(dtend);
                                eventData.duration = dtend.subtractDate(dtstart);
                                eventData.type = { recurring: true, edited: false };
                                eventData.createdAt = new Date(vevent.getFirstPropertyValue("created"));

                                formatted.push({
                                    ics: event["d:href"][0],
                                    etag,
                                    data: eventData
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

                eventData.title = vevent.getFirstPropertyValue("summary");
                eventData.uid = vevent.getFirstPropertyValue("uid");
                eventData.location = vevent.getFirstPropertyValue("location");
                eventData.description = vevent.getFirstPropertyValue("description");
                eventData.start = new Date(dtstart);
                eventData.end = new Date(dtend);
                eventData.duration = dtend.subtractDate(dtstart);
                eventData.type = { recurring: false, edited: false };
                eventData.createdAt = new Date(vevent.getFirstPropertyValue("created"));

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
