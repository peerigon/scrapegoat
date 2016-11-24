"use strict";

var xmlParser = require("./xml/parser");
var ejs = require("ejs");
var moment = require("moment");

var xml = require("./xml");

var byTimeTemplate = ejs.compile(xml.byTime);
var multigetTemplate = ejs.compile(xml.multiget);

function createCalendar(request) {
    function Calendar(config) {
        if (!config) {
            throw new Error("Missing config object");
        }
        this.config = config;
    }

    /**
     * Request ctag.
     * With an ctag you can see if anything in the calendar has changed.
     *
     * @returns {Promise}
     */
    Calendar.prototype.getCtag = function () {
        return request(this.config, "PROPFIND", 0, xml.calendarCtag).then(xmlParser.parseCalendarMultistatus);
    };

    /**
     * Request etags.
     * With an etag you can see if anything in the event has changed.
     *
     * @returns {Promise}
     */
    Calendar.prototype.getEtags = function () {
        return request(this.config, "REPORT", 1, xml.eventsEtag).then(xmlParser.parseEventsMultistatus);
    };

    /**
     * Fetch events with details, which are given with 'events'.
     * 'events' has to be an array with event objects which look like { ics: "/calendars/user/calendar_name/123456789.ics" }.
     *
     * @param {Array} events
     * @returns {Promise}
     */
    Calendar.prototype.getEvents = function (events) {
        var multiget;

        if (Array.isArray(events) === false || events.length === 0) {
            throw new TypeError("getEvents() expects an array of objects with event ids");
        }

        multiget = multigetTemplate({ gets: events });

        return request(this.config, "REPORT", 1, multiget).then(xmlParser.parseEvents);
    };

    /**
     * Fetch all events.

     *
     * @returns {Promise}
     */
    Calendar.prototype.getAllEvents = function () {
        return request(this.config, "REPORT", 1, xml.calendarQuery).then(xmlParser.parseEvents);
    };

    /**
     * Generally fetches all events which occur today,
     * but you can widen or narrow your search with 'start' and 'end'.
     *
     * The date has to be in iCal format, like so '20150101T000000Z'.
     * You can get more information on that here:
     * http://www.kanzaki.com/docs/ical/dateTime.html.
     *
     * @param {string} start
     * @param {string} end
     * @returns {Promise}
     */
    Calendar.prototype.getEventsByTime = function (start, end) {
        var xmlRequest;

        start = start || moment().startOf("day").format("YYYYMMDD[T]HHmmss[Z]");
        end = end || moment().endOf("day").format("YYYYMMDD[T]HHmmss[Z]");

        xmlRequest = byTimeTemplate({ start, end });
        return request(this.config, "REPORT", 1, xmlRequest).then(xmlParser.parseEvents);
    };

    return Calendar;
}

module.exports = createCalendar;
