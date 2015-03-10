"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var calendar = new Schema({
    href: String,
    name: String,
    ctag: String
});

if (!calendar.options.toObject) calendar.options.toObject = {};
calendar.options.toObject.transform = function (doc, ret, options) {
    // remove the _id of every document before returning the result
    delete ret._id;
    delete ret.__v;
};

module.exports = calendar;