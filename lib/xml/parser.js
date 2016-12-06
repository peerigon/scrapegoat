"use strict";

const parseXMLString = require("xml2js").parseString;
const nodefn = require("when/node");
const ical = require("ical");
const moment = require("moment");

function icalDateToISO(icalDate) {
    return icalDate.substring(0, 4) + "-" + icalDate.substring(4, 6) + "-" + icalDate.substring(6, 8) + "T" + icalDate.substring(9, 11) + ":" + icalDate.substring(11, 13) + ":" + icalDate.substring(13, 15) + "Z";
}

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
            const data = {};
            const calendarData = event["d:propstat"][0]["d:prop"][0]["cal:calendar-data"][0];
            const iCalEvent = ical.parseICS(calendarData);

            etag = etag.substring(1, etag.length);

            for (const uid in iCalEvent) {
                if (iCalEvent.hasOwnProperty(uid)) {
                    const ev = iCalEvent[uid];

                    data.title = ev.summary ? ev.summary : null;
                    data.description = ev.description ? ev.description : null;
                    data.url = ev.url ? ev.url : null;
                    data.uid = ev.uid ? ev.uid : null;
                    data.location = ev.location ? ev.location : null;
                    data.geo = ev.geo ? ev.geo : null;
                    data.start = ev.start ? new Date(ev.start) : null;
                    data.end = ev.end ? new Date(ev.end) : null;
                    data.createdAt = ev.created ? new Date(moment(icalDateToISO(ev.created), moment.ISO_8601)) : null;
                }
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
