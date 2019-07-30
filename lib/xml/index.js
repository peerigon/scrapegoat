"use strict";

const fs = require("fs");
const path = require("path");

const xml = {
    calendarCtag: fs.readFileSync(path.join(__dirname, "/calendar_ctag.xml"), "utf8"),
    eventsEtag: fs.readFileSync(path.join(__dirname, "/events_etag.xml"), "utf8"),
    multiget: fs.readFileSync(path.join(__dirname, "/multiget.xml"), "utf8"),
    calendarQuery: fs.readFileSync(path.join(__dirname, "/calendarQuery.xml"), "utf8"),
    taskQuery: fs.readFileSync(path.join(__dirname, "/taskQuery.xml"), "utf8"),
    byTime: fs.readFileSync(path.join(__dirname, "/byTime.xml"), "utf8"),
    tasksPendingByTime: fs.readFileSync(path.join(__dirname, "/tasksPendingByTimeTemplate.xml"), "utf8"),
    addTask: fs.readFileSync(path.join(__dirname, "/addTask.ical"), "utf8")
};

module.exports = xml;
