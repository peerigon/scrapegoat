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
        const response = fixtures.getCtagResponse;
        const request = Promise.resolve(response);
        const Calendar = createCalendar(() => request);

        expect(() => new Calendar()).to.throw(Error, /Missing config object/);
    });

    describe(".getCtag()", () => {

        it("should return an object with information about the calendar", () => {
            const response = fixtures.getCtagResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
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
            const response = fixtures.getEtagsResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            return calendar
            .getEtags()
            .then((response) => {
                expect(response).to.be.an("array");
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

        it("should throw if events param is not provided", () => {
            const response = fixtures.getEventsResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            expect(() => calendar.getEvents()).to.throw(TypeError);
        });

        it("should throw if events param is not an array", () => {
            const response = fixtures.getEventsResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            expect(() => calendar.getEvents({})).to.throw(TypeError);
        });

        it("should throw if events param is an empty array", () => {
            const response = fixtures.getEventsResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            expect(() => calendar.getEvents([])).to.throw(TypeError);
        });

        it.skip("should call request with given config as first argument", () => {
            const response = fixtures.getEventsResponse;
            // const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
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
            const response = fixtures.getEventsResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);
            const events = [
                { ics: "/calendars/user/calendar_name/nodeschool-augsburg.ics" },
                { ics: "/calendars/user/calendar_name/sampleevent.ics" },
                { ics: "/calendars/user/calendar_name/importantevent.ics" }
            ];

            return calendar
            .getEvents(events)
            .then((response) => {
                expect(response).to.be.an("array");
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
