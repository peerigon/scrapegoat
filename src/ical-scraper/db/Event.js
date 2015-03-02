"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var event = new Schema({
    ics: String,
    etag: String,
    start: Date,
    end: Date,
    description: String,
    title: String,
    lastModified: Date,
    created: Date,
    uid: String
});

if (!event.options.toObject) event.options.toObject = {};
event.options.toObject.transform = function (doc, ret, options) {
    // remove the _id of every document before returning the result
    delete ret._id;
    delete ret.__v;
}

module.exports = event;