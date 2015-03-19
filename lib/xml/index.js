'use strict';

var fs = require('fs');

var xml = {
    calendar_ctag: fs.readFileSync(__dirname + '/calendar_ctag.xml', 'utf8'),
    events_etag: fs.readFileSync(__dirname + '/events_etag.xml', 'utf8'),
    multiget: fs.readFileSync(__dirname + '/multiget.xml', 'utf8'),
    calendar_data: fs.readFileSync(__dirname + '/calendar_data.xml', 'utf8'),
    byTime: fs.readFileSync(__dirname + '/byTime.xml', 'utf8')
};

module.exports = xml;