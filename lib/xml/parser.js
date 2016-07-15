"use strict";

var parseXMLString = require("xml2js").parseString;
var nodefn = require("when/node");
var ical = require("ical");
var path = require("path");
var moment = require("moment");

function icalDateToISO(icalDate) {
    return icalDate.substring(0, 4) + "-" + icalDate.substring(4, 6) + "-" + icalDate.substring(6, 8) + "T" + icalDate.substring(9, 11) + ":" + icalDate.substring(11, 13) + ":" + icalDate.substring(13, 15) + "Z";
}

// parse calendar object
function parseCalendarMultistatus(xml) {
    return nodefn.call(parseXMLString, xml).then(function (result) {
        var parsed = {};

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
    var parsed;
    var formatted = [];

    return nodefn.call(parseXMLString, xml).then(function (result) {
        if (!result["d:multistatus"] || !result["d:multistatus"]["d:response"]) {
            return formatted;
        }

        parsed = result["d:multistatus"]["d:response"];

        // parse must not be undefined!
        parsed.forEach(function (event) {
            // fix etag string (renders as '"[...]"', ugly xml2js objects (pew pew)
            var etag = event["d:propstat"][0]["d:prop"][0]["d:getetag"][0];

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
    var parsed;
    var formatted = [];
    var iCalEvents = ical.parseICS(xml);

    return nodefn.call(parseXMLString, xml).then(function (result) {
        if (!result["d:multistatus"] || !result["d:multistatus"]["d:response"]) {
            return formatted;
        }

        parsed = result["d:multistatus"]["d:response"];

        parsed.forEach(function (event) {
            var etag = event["d:propstat"][0]["d:prop"][0]["d:getetag"][0];
            var data = {};
            var iCalEvent = iCalEvents[path.basename(event["d:href"][0], ".ics")];

            etag = etag.substring(1, etag.length);
            data.title = iCalEvent.summary;
            data.uid = iCalEvent.uid;
            data.start = new Date(iCalEvent.start);
            data.end = new Date(iCalEvent.end);
            data.createdAt = new Date(moment(icalDateToISO(iCalEvent.created), moment.ISO_8601));

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
