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
            const vevent = comp.getFirstSubcomponent("vevent");
            const eventData = new ICAL.Event(vevent);

            if (eventData.isRecurring()) {
                // This is a recurring event, expand the next few occurances
            } else {
                // This is not a recurring event
                // It could be a multiple day event or a single day event
                const dtstart = vevent.getFirstPropertyValue("dtstart");
                const dtend = vevent.getFirstPropertyValue("dtend");
                const start = new ICAL.Time(dtstart);
                const end = new ICAL.Time(dtend);

                data.title = vevent.getFirstPropertyValue("summary");
                data.description = vevent.getFirstPropertyValue("description");
                data.url = vevent.getFirstPropertyValue("url");
                data.uid = vevent.getFirstPropertyValue("uid");
                data.location = vevent.getFirstPropertyValue("location");
                data.geo = vevent.getFirstPropertyValue("geo");
                data.rrule = vevent.getFirstPropertyValue("rrule");
                data.exdate = vevent.getFirstPropertyValue("exdate");
                data.recurrenceid = vevent.getFirstPropertyValue("recurrenceid");
                data.start = start.toICALString();
                data.end = end.toICALString();
                data.createdAt = vevent.getFirstPropertyValue("created").toICALString();

                // console.log(start.toString());
                // console.log(end.toString());
                // console.log(dtend.subtractDate(dtstart).toString());

                // if (dtend.subtractDate(dtstart).toString() === "P1D") {
                //     console.log("Single Day Event");
                // }
            }

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
