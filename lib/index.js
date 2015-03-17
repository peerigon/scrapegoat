"use strict";

var when = require('when');
var request = require('request');
var xmlParser = require('./xml/parser');
var ejs = require('ejs');

var xml = require('./xml');

var Receiver = function (config) {
    if (typeof config === 'undefined') {
        throw new Error('undefined is not a valid configuration object.')
    }

    this.config = {
        uri: config.uri,
        auth: {
            user: config.user,
            pass: config.pass,
            sendImmediately: false
        },
        rejectUnauthorized: false,
        headers: {
            'Content-type': 'application/xml; charset=utf-8',
            'User-Agent': 'CalDavClient',
            'Prefer': 'return-minimal'
        }
    };
};

Receiver.prototype.getCalendarWithCtag = function () {
    return this.doRequest(xml.calendar_ctag, 'PROPFIND', 0).then(function (response) {
        return xmlParser.parseCalendarMultistatus(response);
    });
};

Receiver.prototype.getEventsWithEtag = function () {
    return this.doRequest(xml.events_etag, 'REPORT', 1).then(function (response) {
        return xmlParser.parseEventsMultistatus(response);
    });
};

Receiver.prototype.getEvents = function (events) {
    if (events === undefined || !Array.isArray(events) || (Array.isArray(events) && events.length === 0)) return [];
    var multiget = ejs.compile(xml.multiget)({gets: events});
    return this.doRequest(multiget, 'REPORT', 1).then(function (response) {
        return xmlParser.parseEvents(response);
    });
};

Receiver.prototype.doRequest = function (xml, httpMethod, depth) {

    this.config.body = xml;
    this.config.method = httpMethod;
    this.config.headers['Content-length'] = this.config.body.length;
    this.config.headers.Depth = depth;

    var self = this;

    return when.promise(function (resolve, reject) {

        request(self.config, function (err, res, body) {

            if (err) {
                reject(err);
                return;
            }

            if (res.statusCode > 300) {
                var err = new Error('Response with status code: ' + res.statusCode);
                err.statusCode = res.statusCode;

                reject(err);
                return;
            }

            resolve(body);
        });
    });
};

module.exports = Receiver;