"use strict";

var fs = require("fs");
var path = require("path");

var xml = {
    calendarCtag: fs.readFileSync(path.join(__dirname, "/calendar_ctag.xml"), "utf8"),
    eventsEtag: fs.readFileSync(path.join(__dirname, "/events_etag.xml"), "utf8"),
    multiget: fs.readFileSync(path.join(__dirname, "/multiget.xml"), "utf8"),
    calendarQuery: fs.readFileSync(path.join(__dirname, "/calendarQuery.xml"), "utf8"),
    byTime: fs.readFileSync(path.join(__dirname, "/byTime.xml"), "utf8")
};

module.exports = xml;
