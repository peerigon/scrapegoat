"use strict";

// TODO: make it more flexible

var parseXMLString = require('xml2js').parseString;
var path = require('path');
var nodefn = require('when/node');

// parse calendar
function parseCalendarMultistatus(xml) {

    return nodefn.call(parseXMLString, xml).then(function (result) {

        var parsed = {};

        parsed.href = result['d:multistatus']['d:response'][0]['d:href'][0];
        parsed.name = result['d:multistatus']['d:response'][0]['d:propstat'][0]['d:prop'][0]['d:displayname'][0];
        parsed.ctag = result['d:multistatus']['d:response'][0]['d:propstat'][0]['d:prop'][0]['cs:getctag'][0];

        return parsed;
    });
}

// parse events
function parseEventsMultistatus(xml) {

    var parsed = '',
        formatted = [];

    return nodefn.call(parseXMLString, xml).then(function (result) {

        parsed = result['d:multistatus']['d:response'];

        parsed.forEach(function (event) {

            // fix etag string (renders as '"[...]"', ugly xml2js objects (pew pew)
            var etag = event['d:propstat'][0]['d:prop'][0]['d:getetag'][0];
            etag = etag.substring(1, etag.length);

            formatted.push({
                ics: path.basename(event['d:href'][0]),
                etag: etag
            });

        });

        return formatted;

    });
}

exports.parseEventsMultistatus = parseEventsMultistatus;
exports.parseCalendarMultistatus = parseCalendarMultistatus;