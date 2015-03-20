'use strict';

var fs = require('fs');

var xml = {
    calendarCtag: fs.readFileSync(__dirname + '/calendar_ctag.xml', 'utf8'),
    eventsEtag: fs.readFileSync(__dirname + '/events_etag.xml', 'utf8'),
    multiget: fs.readFileSync(__dirname + '/multiget.xml', 'utf8'),
    calendarQuery: fs.readFileSync(__dirname + '/calendarQuery.xml', 'utf8'),
    byTime: fs.readFileSync(__dirname + '/byTime.xml', 'utf8')
};

module.exports = xml;