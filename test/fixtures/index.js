"use strict";

const fs = require("fs");
const path = require("path");

const fixtures = {
    getCtagRequestBody: fs.readFileSync(path.join(__dirname, "/info.request.body.xml"), "utf8"),
    getCtagResponse: fs.readFileSync(path.join(__dirname, "/info.response.xml"), "utf8"),
    getEtagsResponse: fs.readFileSync(path.join(__dirname, "/etags.response.xml"), "utf8"),
    getEventsResponse: fs.readFileSync(path.join(__dirname, "/events.response.xml"), "utf8")
};

module.exports = fixtures;
