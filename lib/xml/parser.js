"use strict";

var parseXMLString = require('xml2js').parseString;
var nodefn = require('when/node');
var ical = require('ical');
var path = require('path');
var moment = require('moment');

function prettyDate(weirdDateFormat){
    return weirdDateFormat.substring(0,4)+"-"+weirdDateFormat.substring(4,6)+"-"+weirdDateFormat.substring(6,8)+"T"+weirdDateFormat.substring(9,11)+":"+weirdDateFormat.substring(11,13)+":"+weirdDateFormat.substring(13,15)+"Z";
}

// parse calendar object
function parseCalendarMultistatus(xml) {

    return nodefn.call(parseXMLString, xml).then(function (result) {

        var parsed = {};

        if (!result['d:multistatus'] || !result['d:multistatus']['d:response']) {
            return parsed;
        }

        parsed.href = result['d:multistatus']['d:response'][0]['d:href'][0];
        parsed.name = result['d:multistatus']['d:response'][0]['d:propstat'][0]['d:prop'][0]['d:displayname'][0];
        parsed.ctag = result['d:multistatus']['d:response'][0]['d:propstat'][0]['d:prop'][0]['cs:getctag'][0];

        return parsed;
    });
}

// parse events
function parseEventsMultistatus(xml) {

    var parsed,
        formatted = [];

    return nodefn.call(parseXMLString, xml).then(function (result) {

        if (!result['d:multistatus'] || !result['d:multistatus']['d:response']) {
            return formatted;
        }

        parsed = result['d:multistatus']['d:response'];;

        // parse must not be undefined!
        parsed.forEach(function (event) {

            // fix etag string (renders as '"[...]"', ugly xml2js objects (pew pew)
            var etag = event['d:propstat'][0]['d:prop'][0]['d:getetag'][0];
            etag = etag.substring(1, etag.length);

            formatted.push({
                ics: event['d:href'][0],
                etag: etag
            });

        });

        return formatted;

    });
}

function parseEvents(xml) {

    var parsed,
        formatted = [],
        ical_events = ical.parseICS(xml);

    return nodefn.call(parseXMLString, xml).then(function (result) {

        if (!result['d:multistatus'] || !result['d:multistatus']['d:response']) return formatted;

        parsed = result['d:multistatus']['d:response'];

        parsed.forEach(function (event) {

            var etag = event['d:propstat'][0]['d:prop'][0]['d:getetag'][0];
            etag = etag.substring(1, etag.length);

            var data = {};
            var ical_event = ical_events[path.basename(event['d:href'][0], '.ics')];

            data.title = ical_event.summary;
            data.description = ical_event.description;
            data.start = new Date(ical_event.start);
            data.end = new Date(ical_event.end);
            data.createdAt = new Date(moment(prettyDate(ical_event.created), moment.ISO_8601));

            formatted.push({
                ics: event['d:href'][0],
                etag: etag,
                data: data
            });
        });

        return formatted;
    });
}

exports.parseEventsMultistatus = parseEventsMultistatus;
exports.parseCalendarMultistatus = parseCalendarMultistatus;
exports.parseEvents = parseEvents;