"use strict";

const expect = require("chai").expect;
const createCalendar = require("../lib/Calendar");
const fixtures = require("./fixtures/index");

const CALENDAR_DOMAIN = "http://example.com";
const CALENDAR_PATH = "/cal.php/calendars/user/calendar_name/";

describe("Calendar", () => {

    describe(".getCtag()", () => {

        it("should return an object with information about the calendar", () => {
            const config = {
                auth: {
                    user: "username",
                    pass: "password"
                },
                uri: CALENDAR_DOMAIN + CALENDAR_PATH
            };
            const response = fixtures.response;

            function request() {
                return Promise.resolve(response);
            }

            const Calendar = createCalendar(request);
            const calendar = new Calendar(config);

            return calendar
            .getCtag()
            .then((info) => {
                expect(info).to.have.property("href", CALENDAR_PATH);
                expect(info).to.have.property("name", "Default calendar");
                expect(info).to.have.property("ctag", "http://sabre.io/ns/sync/3");
            })
            .catch((err) => {
                throw err;
            });
        });

    });

});
