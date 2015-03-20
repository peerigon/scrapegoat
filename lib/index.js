"use strict";

var request = require('./request');
var xmlParser = require('./xml/parser');
var ejs = require('ejs');
var moment = require('moment');

var xml = require('./xml');

var byTimeTemplate = ejs.compile(xml.byTime);
var multigetTemplate = ejs.compile(xml.multiget);

function Client(config) {
    if (!config) throw new Error('Missing config object');
    this.config = config;
}

Client.prototype.getCalendarWithCtag = function () {
    return request(this.config, 'PROPFIND', 0, xml.calendar_ctag).then(xmlParser.parseCalendarMultistatus);
};

Client.prototype.getEventsWithEtag = function () {
    return request(this.config, 'REPORT', 1, xml.events_etag).then(xmlParser.parseEventsMultistatus);
};

// TODO: only use ics links to determine which events to fetch
Client.prototype.getEvents = function (events) {
    if (events === undefined || !Array.isArray(events) || (Array.isArray(events) && events.length === 0)) return [];
    var multiget = multigetTemplate({ gets: events });
    return request(this.config, 'REPORT', 1, multiget).then(xmlParser.parseEvents);
};

Client.prototype.getAllEvents = function () {
    return request(this.config, 'REPORT', 1, xml.calendar_data).then(xmlParser.parseEvents);
};

Client.prototype.getEventsFromToday = function (startDate, endDate) {
    startDate = startDate || moment().startOf('day').format('YYYYMMDD[T]HHmmss[Z]');
    endDate = endDate || moment().endOf('day').format('YYYYMMDD[T]HHmmss[Z]');

    var xmlRequest = byTimeTemplate({ startDate: startDate, endDate: endDate });
    return request(this.config, 'REPORT', 1, xmlRequest).then(xmlParser.parseEvents);
};

module.exports = Client;