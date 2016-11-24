"use strict";

var expect = require("chai").expect;
var createCalendar = require("../lib/index");

var request = require("../lib/request");
var CALENDAR_DOMAIN = "http://example.com";
var CALENDAR_PATH = "/cal.php/calendars/user/calendar_name/";

// var fixtures = require("./fixtures/index");

describe("Calendar", function () {

    describe(".getCtag()", function () {

        it.only("should return an object with information about the calendar", function (done) {
            var baseConfig = {
                auth: {
                    user: "username",
                    pass: "password"
                },
                uri: CALENDAR_DOMAIN + CALENDAR_PATH
            };
            // var method = "PROPFIND";
            // var depth = 0;
            // var xml = fixtures.requestBody;
            var calendar = createCalendar(request)(baseConfig);

            return calendar.getCtag()
            .then(function (info) {
                console.log(info);
                expect(info).to.have.property("href", CALENDAR_PATH);
                expect(info).to.have.property("name", "Default calendar");
                expect(info).to.have.property("ctag", "http://sabre.io/ns/sync/3");
            })
            .then(function () {
                done();
            })
            .catch(function (err) {
                done(err);
            });
        });

    });

});
