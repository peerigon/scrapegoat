"use strict";

const fs = require("fs");
const path = require("path");

const fixtures = {
    getCtagResponse: fs.readFileSync(path.join(__dirname, "/ctag.response.xml"), "utf8"),
    getCtagResponseNoNS: fs.readFileSync(path.join(__dirname, "/ctag_empty_ns.response.xml"), "utf8"),
    getEtagsResponse: fs.readFileSync(path.join(__dirname, "/etags.response.xml"), "utf8"),
    getEventsResponse: fs.readFileSync(path.join(__dirname, "/events.response.xml"), "utf8"),
    getAllEventsResponse: fs.readFileSync(path.join(__dirname, "/eventsAll.response.xml"), "utf8"),
    getEventsByTimeResponse: fs.readFileSync(path.join(__dirname, "/eventsByTime.response.xml"), "utf8"),
    getFutureEventsResponse: fs.readFileSync(path.join(__dirname, "/eventsFuture.response.xml"), "utf8")
};

module.exports = fixtures;
