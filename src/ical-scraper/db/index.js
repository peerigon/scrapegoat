"use strict";

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/test"); // TODO: this has to be in a config file

exports.Calendar = mongoose.model("Calendar", require('./Calendar'));
exports.Event = mongoose.model("Entry", require('./Event'));