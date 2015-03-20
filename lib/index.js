"use strict";

var request = require('./request');
var xmlParser = require('./xml/parser');
var ejs = require('ejs');
var moment = require('moment');
var when = require('when');

var xml = require('./xml');

var byTimeTemplate = ejs.compile(xml.byTime);
var multigetTemplate = ejs.compile(xml.multiget);

function Client(config) {
    if (!config) throw new Error('Missing config object');
    this.config = config;
}

/**
 * Request ctag.
 * With an ctag you can see if anything in the calendar has changed.
 *
 * @returns {Promise}
 */
Client.prototype.getCtag = function () {
    return request(this.config, 'PROPFIND', 0, xml.calendarCtag).then(xmlParser.parseCalendarMultistatus);
};

/**
 * Request etags.
 * With an etag you can see if anything in the event has changed.
 *
 * @returns {Promise}
 */
Client.prototype.getEtags = function () {
    return request(this.config, 'REPORT', 1, xml.eventsEtag).then(xmlParser.parseEventsMultistatus);
};


/**
 * Fetch events with details, which are given with 'events'.
 * 'events' has to be an array with event objects which look like { ics: "/calendars/user/calendar_name/123456789.ics" }
 *
 * @param events
 * @returns {Promise}
 */
Client.prototype.getEvents = function (events) {
    if (events === undefined || !Array.isArray(events) || (Array.isArray(events) && events.length === 0)) return when.resolve([]);
    var multiget = multigetTemplate({ gets: events });
    return request(this.config, 'REPORT', 1, multiget).then(xmlParser.parseEvents);
};

/**
 * Fetch all events.

 *
 * @returns {Promise}
 */
Client.prototype.getAllEvents = function () {
    return request(this.config, 'REPORT', 1, xml.calendarQuery).then(xmlParser.parseEvents);
};

/**
 * Generally fetches all events which occur today,
 * but you can widen or narrow your search with 'start' and 'end'
 *
 * The date has to be in iCal format, like so '20150101T000000Z'
 * You can get more information on that here:
 * http://www.kanzaki.com/docs/ical/dateTime.html
 *
 * @param start
 * @param end
 * @returns {Promise}
 */
Client.prototype.getEventsByTime = function (start, end) {
    start = start || moment().startOf('day').format('YYYYMMDD[T]HHmmss[Z]');
    end = end || moment().endOf('day').format('YYYYMMDD[T]HHmmss[Z]');

    var xmlRequest = byTimeTemplate({ start: start, end: end });
    return request(this.config, 'REPORT', 1, xmlRequest).then(xmlParser.parseEvents);
};

module.exports = Client;