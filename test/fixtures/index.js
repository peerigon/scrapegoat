"use strict";

const fs = require("fs");
const path = require("path");

const fixtures = {
    requestBody: fs.readFileSync(path.join(__dirname, "/info.request.body.xml"), "utf8"),
    response: fs.readFileSync(path.join(__dirname, "/info.response.xml"), "utf8")
};

module.exports = fixtures;
