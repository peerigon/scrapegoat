"use strict";

const fs = require("fs");
const path = require("path");

const fixtures = {
    getCtagResponse: fs.readFileSync(path.join(__dirname, "/ctag.response.xml"), "utf8"),
    getEtagsResponse: fs.readFileSync(path.join(__dirname, "/etags.response.xml"), "utf8"),
    getEventsResponse: fs.readFileSync(path.join(__dirname, "/events.response.xml"), "utf8")
};

module.exports = fixtures;
