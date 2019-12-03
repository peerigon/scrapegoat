"use strict";

const xmlParser = require("./xml/parser");
const ejs = require("ejs");
const moment = require("moment");

const xml = require("./xml");

const byTimeTemplate = ejs.compile(xml.byTime);
const multigetTemplate = ejs.compile(xml.multiget);

function createCalendar(request) {
    class Calendar {
        constructor(config) {
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
        getCtag() {
            return request(this.config, "PROPFIND", 0, xml.calendarCtag).then(xmlParser.parseCalendarMultistatus);
        }

        /**
         * Request etags.
         * With an etag you can see if anything in the event has changed.
         *
         * @returns {Promise}
         */
        getEtags() {
            return request(this.config, "REPORT", 1, xml.eventsEtag).then(xmlParser.parseEventsMultistatus);
        }

        /**
         * Fetch events with details, which are given with 'events'.
         * 'events' has to be an array with event objects which look like { ics: "/calendars/user/calendar_name/123456789.ics" }.
         *
         * @param {Array} events
         * @returns {Promise}
         */
        getEvents(events) {
            if (Array.isArray(events) === false || events.length === 0) {
                throw new TypeError("getEvents() expects an array of objects with event ids");
            }

            const multiget = multigetTemplate({ gets: events });

            return request(this.config, "REPORT", 1, multiget).then(xmlParser.parseEvents);
        }

        /**
         * Fetch all events.

        *
        * @returns {Promise}
        */
        getAllEvents() {
            return request(this.config, "REPORT", 1, xml.calendarQuery).then(xmlParser.parseEvents);
        }

        /**
         * Generally fetches all upcoming events from today,
         * but you can widen or narrow your search with 'start' and 'end'.
         * The end-date must be larger than the start date.
         *
         * The date has to be in iCal format, like so '20150101T000000Z'.
         * You can get more information on that here:
         * http://www.kanzaki.com/docs/ical/dateTime.html.
         *
         * @param {string} start
         * @param {string} end
         * @returns {Promise}
         */
        getEventsByTime(start, end) {
            start = start || moment().startOf("day").format("YYYYMMDD[T]HHmmss[Z]");
            end = end || null;

            if (Boolean(end) && moment(end).isSameOrBefore(start)) {
                // CalDAV requires end-date to be larger than start-date
                end = null;
            }

            const xmlRequest = byTimeTemplate({ start, end });

            return request(this.config, "REPORT", 1, xmlRequest)
                .then(xml => xmlParser.parseEvents(xml, start, end))
                .then(events => {
                    return events.filter(event => {
                        const isNotRecurring = !event.data.type.recurring;
                        const isSameDayOrAfter = moment(event.data.start).isSameOrAfter(start, "day");

                        return isNotRecurring || isSameDayOrAfter;
                    });
                });
        }
    }

    return Calendar;
}

module.exports = createCalendar;
