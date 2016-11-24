"use strict";

var fs = require("fs");
var path = require("path");

var fixtures = {
    requestBody: fs.readFileSync(path.join(__dirname, "/info.request.body.xml"), "utf8")
};

module.exports = fixtures;
