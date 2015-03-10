"use strict";

/**
 *
 * @type {exports}
 */

var when = require('when');
var mongoose = require('mongoose');
var Calendar = require('../lib/autoresponder/db').Calendar;
var Event = require('../lib/autoresponder/db').Event;
var Receiver = require('../lib/caldav/receiver');
var util = require('util');

var calResponse = {
    props: {
        href: null,
        name: null,
        ctag: null
    },
    events: {
        'new': [],
        'modified': [],
        'unchanged': []
    }
}; // object we want to work with

var rec = new Receiver({
    user: 'test',
    pass: 'arschkrampe',
    uri: 'https://sepp.peerigon.com/cal.php/calendars/test/urlaub'
});

function buildResponse(cal) {

        calResponse.props.href = cal.href;
        calResponse.props.ctag = cal.ctag;
        calResponse.props.name = cal.name;

        return rec.getEventsWithEtag().then(function (events) {
            return when.map(events, checkEventAgainstDb);
        });
}

/**
 *
 * @param calendar
 * @returns {Promise|*}
 */
function getCalendarFromDb(calendar) {

    return when.promise(function (resolve, reject) {

        var query = Calendar.where({
            href: calendar.href,
            name: calendar.name
        });

        query.findOne(function (error, resCalendar) {

            if (error) {
                reject(error);
                return;
            }

            resolve(resCalendar);
        });
    });
}

/**
 *
 * @param event
 * @returns {Promise|*}
 */
function checkEventAgainstDb(event) {

    return when.promise(function (resolve, reject) {

        var query = Event.where({
            ics: event.ics,
            etag: event.etag
        });

        query.findOne(function (error, resEvent) {

            if (error) {
                reject(error);
                return;
            }

            resolve(resEvent);
        });
    }).then(function (resEvent) {

        if (resEvent === null) calResponse.events['new'].push(event);
        else if (resEvent.ctag === event.ctag) calResponse.events['unchanged'].push(event);
        else if (resEvent.ctag !== event.ctag) calResponse.events['modified'].push(event);

        return calResponse;
    });
}

// start by fetching the calendar, looking for a modified ctag
rec.getCalendarWithCtag()
    .then(function (cal) {

        return [cal, getCalendarFromDb(cal)]

    }).spread(function (calendar, dbCalendar) {

        // what are we doing now? compare the calendar objects

        // 1) if calendar is new or ctag has changed return calendar object
        if (dbCalendar === null || calendar.ctag !== dbCalendar.ctag) return buildResponse(calendar);

        // 2) do nothing, if ctags are equal
        if (dbCalendar.ctag === calendar.ctag) return null;

        throw ('Error: no condition applied - this is a logic error.')

    }).done(function () {

        // TODO: emit events or something else because we want delegate db actions to another handler
        console.log(util.inspect(calResponse, {depth: null, colors: true}));

        mongoose.disconnect();

    }, function (error) {
        throw new Error(error);
    }
);