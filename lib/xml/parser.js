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

            const data = {};
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

                        console.log("==> ", nextOccuranceTime.toString());

                        if (modifiedOccurences.length === 0) {
                            // No events have been modified
                            data.title = nextEvent.item.summary;
                            data.uid = nextEvent.item.uid;
                            data.location = nextEvent.item.location;
                            data.description = nextEvent.item.description;
                            data.start = nextEvent.startDate.toString();
                            data.end = nextEvent.endDate.toString();
                            data.createdAt = vevent.getFirstPropertyValue("created").toICALString();
                        } else {
                            // There are modified occurences
                            if (isModified(nextOccuranceTime, modifiedOccurences)) {
                                // This is the event that has been modied
                                const key = getModifiedOccuranceKey(nextOccuranceTime, modifiedOccurences) || 0;

                                data.title = vevents[key].getFirstPropertyValue("summary");
                                data.uid = vevents[key].getFirstPropertyValue("uid");
                                data.location = vevents[key].getFirstPropertyValue("location");
                                data.description = vevents[key].getFirstPropertyValue("description");
                                data.start = vevents[key].getFirstPropertyValue("dtstart").toICALString();
                                data.end = vevents[key].getFirstPropertyValue("dtend").toICALString();
                                data.createdAt = vevents[key].getFirstPropertyValue("created").toICALString();
                            } else {
                                // Expand this event normally
                                data.title = nextEvent.item.summary;
                                data.uid = nextEvent.item.uid;
                                data.location = nextEvent.item.location;
                                data.description = nextEvent.item.description;
                                data.start = nextEvent.startDate.toString();
                                data.end = nextEvent.endDate.toString();
                                data.createdAt = vevent.getFirstPropertyValue("created").toICALString();
                            }
                        }
                    }
                }
            } else {
                // This is not a recurring event
                // It could be a multiple day event or a single day event
                const dtstart = vevent.getFirstPropertyValue("dtstart");
                const dtend = vevent.getFirstPropertyValue("dtend");
                const start = new ICAL.Time(dtstart);
                const end = new ICAL.Time(dtend);

                data.title = vevent.getFirstPropertyValue("summary");
                data.uid = vevent.getFirstPropertyValue("uid");
                data.location = vevent.getFirstPropertyValue("location");
                data.description = vevent.getFirstPropertyValue("description");
                data.start = start.toICALString();
                data.end = end.toICALString();
                data.duration = dtend.subtractDate(dtstart);
                data.type = { recurring: false, edited: false };
                data.createdAt = vevent.getFirstPropertyValue("created").toICALString();
            }

            // console.log("title: ", data.title);
            // console.log("uid: ", data.uid);
            // console.log("location: ", data.location);
            // console.log("description: ", data.description);
            // console.log("start: ", data.start);
            // console.log("end: ", data.end);
            // console.log("createdAt: ", data.createdAt);

            // console.log("\n");

            formatted.push({
                ics: event["d:href"][0],
                etag,
                data
            });
        });

        return formatted;
    });
}

exports.parseEventsMultistatus = parseEventsMultistatus;
exports.parseCalendarMultistatus = parseCalendarMultistatus;
exports.parseEvents = parseEvents;
