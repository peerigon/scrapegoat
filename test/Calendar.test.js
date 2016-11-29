"use strict";

const expect = require("chai").expect;
const createCalendar = require("../lib/Calendar");
const fixtures = require("./fixtures/index");

const CALENDAR_DOMAIN = "http://example.com";
const CALENDAR_PATH = "/cal.php/calendars/user/calendar_name/";
const config = {
    auth: {
        user: "username",
        pass: "password"
    },
    uri: CALENDAR_DOMAIN + CALENDAR_PATH
};

describe("Calendar", () => {

    it("should throw if config object is not passed", () => {
        const Calendar = createCalendar(() => {
            return Promise.resolve(fixtures.response);
        });

        function calendar() {
            return new Calendar();
        }

        expect(calendar).to.throw(Error, /Missing config object/);
    });

    describe(".getCtag()", () => {

        it("should return an object with information about the calendar", () => {
            const Calendar = createCalendar(() => {
                return Promise.resolve(fixtures.getCtagResponse);
            });
            const calendar = new Calendar(config);

            return calendar
            .getCtag()
            .then((response) => {
                expect(response).to.have.property("href", CALENDAR_PATH);
                expect(response).to.have.property("name", "Default calendar");
                expect(response).to.have.property("ctag", "http://sabre.io/ns/sync/3");
            })
            .catch((err) => {
                throw err;
            });
        });

    });

    describe(".getEtags()", () => {

        it("should return an array of object with etags of all events", () => {
            const Calendar = createCalendar(() => {
                return Promise.resolve(fixtures.getEtagsResponse);
            });
            const calendar = new Calendar(config);

            return calendar
            .getEtags()
            .then((response) => {
                expect(response).to.be.instanceof(Array);
                expect(response).to.have.lengthOf(3);
                expect(response[0]).to.have.property("ics");
                expect(response[0]).to.have.property("etag");
            })
            .catch((err) => {
                throw err;
            });
        });

    });

    describe(".getEvents()", () => {

        it("should throw if param is not provided", () => {
            const Calendar = createCalendar(() => {
                return Promise.resolve(fixtures.getEventsResponse);
            });
            const calendar = new Calendar(config);

            function getEvents() {
                return calendar.getEvents();
            }

            expect(getEvents).to.throw(TypeError);
        });

        it("should throw if events param is not an array", () => {
            const Calendar = createCalendar(() => {
                return Promise.resolve(fixtures.getEventsResponse);
            });
            const calendar = new Calendar(config);

            function getEvents() {
                return calendar.getEvents({});
            }

            expect(getEvents).to.throw(TypeError);
        });

        it("should throw if events param is an empty array", () => {
            const Calendar = createCalendar(() => {
                return Promise.resolve(fixtures.getEventsResponse);
            });
            const calendar = new Calendar(config);

            function getEvents() {
                return calendar.getEvents([]);
            }

            expect(getEvents).to.throw(TypeError);
        });

        it("should not throw if events param is an array of objects", () => {
            const Calendar = createCalendar(() => {
                return Promise.resolve(fixtures.getEventsResponse);
            });
            const calendar = new Calendar(config);
            const events = [
                { ics: "/calendars/user/calendar_name/nodeschool-augsburg.ics" },
                { ics: "/calendars/user/calendar_name/sampleevent.ics" },
                { ics: "/calendars/user/calendar_name/importantevent.ics" }
            ];

            function getEvents() {
                return calendar.getEvents(events);
            }

            expect(getEvents).to.not.throw(TypeError);
        });

        it.skip("should call request with given config as first argument", () => {
            const Calendar = createCalendar(() => {
                return Promise.resolve(fixtures.getEventsResponse);
            });
            const calendar = new Calendar(config);
            const events = [
                { ics: "/calendars/user/calendar_name/nodeschool-augsburg.ics" },
                { ics: "/calendars/user/calendar_name/sampleevent.ics" },
                { ics: "/calendars/user/calendar_name/importantevent.ics" }
            ];

            return calendar
            .getEvents(events)
            .then((response) => {
                // expect(requestCalled).to.be.true;
            })
            .catch((err) => {
                throw err;
            });
        });

        it("should return an array of object with the passed events", () => {
            const Calendar = createCalendar(() => {
                return Promise.resolve(fixtures.getEventsResponse);
            });
            const calendar = new Calendar(config);
            const events = [
                { ics: "/calendars/user/calendar_name/nodeschool-augsburg.ics" },
                { ics: "/calendars/user/calendar_name/sampleevent.ics" },
                { ics: "/calendars/user/calendar_name/importantevent.ics" }
            ];

            return calendar
            .getEvents(events)
            .then((response) => {
                expect(response).to.be.instanceof(Array);
                expect(response).to.have.lengthOf(3);
                expect(response[0]).to.have.property("ics");
                expect(response[0]).to.have.property("etag");
                expect(response[0]).to.have.property("data");
            })
            .catch((err) => {
                throw err;
            });
        });

    });

});
