const expect = require("chai").expect;
const sinon = require("sinon");
const createCalendar = require("../lib/Calendar");
const fixtures = require("./fixtures/index");

const CALENDAR_DOMAIN = "http://example.com";
const CALENDAR_PATH = "/cal.php/calendars/user/calendar_name/";
const config = {
    auth: {
        user: "username",
        pass: "password",
    },
    uri: CALENDAR_DOMAIN + CALENDAR_PATH,
};

describe("Calendar", () => {
    it("should throw if config object is not passed", () => {
        const response = fixtures.getCtagResponse;
        const request = Promise.resolve(response);
        const Calendar = createCalendar(() => request);

        expect(() => new Calendar()).to.throw(Error, /Missing config object/);
    });

    describe(".getCtag()", () => {
        it("should call request with the correct arguments in the correct order", () => {
            const response = fixtures.getCtagResponse;
            const request = sinon.stub();
            const requestPromise = Promise.resolve(response);

            request.returns(requestPromise);

            const Calendar = createCalendar(request);
            const calendar = new Calendar(config);

            calendar.getCtag();

            expect(request.callCount).to.equal(1);
            expect(request.firstCall.args[0]).to.equal(config);
            expect(request.firstCall.args[1]).to.equal("PROPFIND");
            expect(request.firstCall.args[2]).to.equal(0);
        });

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
                });
        });

        it("should return an object with information about the calendar (no namespace)", () => {
            const response = fixtures.getCtagNoNamespaceResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            return calendar
                .getCtag()
                .then((response) => {
                    expect(response).to.have.property("href", "/123456789/calendars/DEADB715-BEEF-47E1-A2B6-E1BA415C93AC/");
                    expect(response).to.have.property("name", "My Calendar");
                    expect(response).to.have.property("ctag", "FT=-@RU=1a5c7464-1234-1234-ba09-bb58b7adbac7@S=2012");
                });
        });
    });

    describe(".getEtags()", () => {
        it("should call request with the correct arguments in the correct order", () => {
            const response = fixtures.getEtagsResponse;
            const request = sinon.stub();
            const requestPromise = Promise.resolve(response);

            request.returns(requestPromise);

            const Calendar = createCalendar(request);
            const calendar = new Calendar(config);

            calendar.getEtags();

            expect(request.callCount).to.equal(1);
            expect(request.firstCall.args[0]).to.equal(config);
            expect(request.firstCall.args[1]).to.equal("REPORT");
            expect(request.firstCall.args[2]).to.equal(1);
        });

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
                });
        });

        it("should return an array of object with etags of all events (no namespace)", () => {
            const response = fixtures.getEtagsNoNamespaceResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            return calendar
                .getEtags()
                .then((response) => {
                    expect(response).to.be.an("array");
                    expect(response).to.have.lengthOf(2);
                    expect(response[0]).to.have.property("ics");
                    expect(response[0]).to.have.property("etag");
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

        it("should call request with the correct arguments in the correct order", () => {
            const response = fixtures.getEventsResponse;
            const request = sinon.stub();
            const requestPromise = Promise.resolve(response);

            request.returns(requestPromise);

            const Calendar = createCalendar(request);
            const calendar = new Calendar(config);
            const events = [
                { ics: "/cal.php/calendars/user/calendar_name/nodeschool-augsburg.ics" },
                { ics: "/cal.php/calendars/user/calendar_name/sampleevent.ics" },
                { ics: "/cal.php/calendars/user/calendar_name/importantevent.ics" },
            ];

            calendar.getEvents(events);

            expect(request.callCount).to.equal(1);
            expect(request.firstCall.args[0]).to.equal(config);
            expect(request.firstCall.args[1]).to.equal("REPORT");
            expect(request.firstCall.args[2]).to.equal(1);
        });

        it("should return an array of objects with the passed events", () => {
            const response = fixtures.getEventsResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);
            const events = [
                { ics: "/cal.php/calendars/user/calendar_name/nodeschool-augsburg.ics" },
                { ics: "/cal.php/calendars/user/calendar_name/sampleevent.ics" },
                { ics: "/cal.php/calendars/user/calendar_name/importantevent.ics" },
            ];

            return calendar
                .getEvents(events)
                .then((response) => {
                    expect(response).to.be.an("array");
                    expect(response).to.have.lengthOf(3);
                    expect(response[0]).to.have.property("ics");
                    expect(response[0]).to.have.property("etag");
                    expect(response[0]).to.have.property("data");
                    expect(response[0]).to.have.nested.property("data.title");
                    expect(response[0]).to.have.nested.property("data.uid");
                    expect(response[0]).to.have.nested.property("data.location");
                    expect(response[0]).to.have.nested.property("data.description");
                    expect(response[0]).to.have.nested.property("data.start");
                    expect(response[0]).to.have.nested.property("data.end");
                    expect(response[0]).to.have.nested.property("data.duration");
                    expect(response[0]).to.not.have.nested.property("data.duration.wrappedJSObject");
                    expect(response[0]).to.have.nested.property("data.type");
                    expect(response[0]).to.have.nested.property("data.createdAt");
                });
        });
    });

    describe(".getAllEvents()", () => {
        it("should call request with the correct arguments in the correct order", () => {
            const response = fixtures.getAllEventsResponse;
            const request = sinon.stub();
            const requestPromise = Promise.resolve(response);

            request.returns(requestPromise);

            const Calendar = createCalendar(request);
            const calendar = new Calendar(config);

            calendar.getAllEvents();

            expect(request.callCount).to.equal(1);
            expect(request.firstCall.args[0]).to.equal(config);
            expect(request.firstCall.args[1]).to.equal("REPORT");
            expect(request.firstCall.args[2]).to.equal(1);
        });

        it("should return an array of objects with all events in the calendar", () => {
            const response = fixtures.getAllEventsResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            return calendar
                .getAllEvents()
                .then((response) => {
                    expect(response).to.be.an("array");
                    expect(response).to.have.lengthOf(9);
                    expect(response[0]).to.have.property("ics");
                    expect(response[0]).to.have.property("etag");
                    expect(response[0]).to.have.property("data");
                });
        });

        it("should return an array of objects with all events in the calendar (no namespace)", () => {
            const response = fixtures.getAllEventsNoNamespaceResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            return calendar
                .getAllEvents()
                .then((response) => {
                    expect(response).to.be.an("array");
                    expect(response).to.have.lengthOf(2);
                    expect(response[0]).to.have.property("ics");
                    expect(response[0]).to.have.property("etag");
                    expect(response[0]).to.have.property("data");
                });
        });
    });

    describe(".getEventsByTime()", () => {
        it("should call request with the correct arguments in the correct order", () => {
            const response = fixtures.getEventsByTimeResponse;
            const request = sinon.stub();
            const requestPromise = Promise.resolve(response);

            request.returns(requestPromise);

            const Calendar = createCalendar(request);
            const calendar = new Calendar(config);

            calendar.getEventsByTime("20140101T000000Z", "20151231T235959Z");

            expect(request.callCount).to.equal(1);
            expect(request.firstCall.args[0]).to.equal(config);
            expect(request.firstCall.args[1]).to.equal("REPORT");
            expect(request.firstCall.args[2]).to.equal(1);
        });

        it("should return an array of objects with all events that occur between start and end dates", () => {
            const response = fixtures.getEventsByTimeResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            return calendar
                .getEventsByTime("20140101T000000Z", "20151231T235959Z")
                .then((response) => {
                    expect(response).to.be.an("array");
                    expect(response).to.have.lengthOf(2);
                    expect(response[0]).to.have.property("ics");
                    expect(response[0]).to.have.property("etag");
                    expect(response[0]).to.have.property("data");
                });
        });

        it("should return an array of objects with all upcoming events from today if start and end are left out", () => {
            const response = fixtures.getFutureEventsResponse;
            const request = Promise.resolve(response);
            const Calendar = createCalendar(() => request);
            const calendar = new Calendar(config);

            return calendar
                .getEventsByTime()
                .then((response) => {
                    expect(response).to.be.an("array");
                    expect(response).to.have.lengthOf(1);
                    expect(response[0]).to.have.property("ics");
                    expect(response[0]).to.have.property("etag");
                    expect(response[0]).to.have.property("data");
                });
        });

        describe("recurring events with count", () => {
            it("should expand upto end date if provided", () => {
                const response = fixtures.getRecurringEventsCountResponse;
                const request = Promise.resolve(response);
                const Calendar = createCalendar(() => request);
                const calendar = new Calendar(config);

                return calendar
                    .getEventsByTime("20210601T000000Z", "20210630T000000Z")
                    .then((response) => {
                        expect(response).to.be.an("array");
                        expect(response).to.have.lengthOf(22);
                        expect(response[0]).to.have.property("ics");
                        expect(response[0]).to.have.property("etag");
                        expect(response[0]).to.have.property("data");
                    });
            });

            it("should expand all upcoming events if end date is not provided", () => {
                const response = fixtures.getRecurringEventsCountResponse;
                const request = Promise.resolve(response);
                const Calendar = createCalendar(() => request);
                const calendar = new Calendar(config);

                return calendar
                    .getEventsByTime("20210601T000000Z")
                    .then((response) => {
                        expect(response).to.be.an("array");
                        expect(response).to.have.lengthOf(29);
                        expect(response[0]).to.have.property("ics");
                        expect(response[0]).to.have.property("etag");
                        expect(response[0]).to.have.property("data");
                    });
            });
        });

        describe("recurring events with until date", () => {
            it("should expand upto end date if provided", () => {
                const response = fixtures.getRecurringEventsUntilResponse;
                const request = Promise.resolve(response);
                const Calendar = createCalendar(() => request);
                const calendar = new Calendar(config);

                return calendar
                    .getEventsByTime("20210601T000000Z", "20210630T000000Z")
                    .then((response) => {
                        expect(response).to.be.an("array");
                        expect(response).to.have.lengthOf(22);
                        expect(response[0]).to.have.property("ics");
                        expect(response[0]).to.have.property("etag");
                        expect(response[0]).to.have.property("data");
                    });
            });

            it("should expand all upcoming events if end date is not provided", () => {
                const response = fixtures.getRecurringEventsUntilResponse;
                const request = Promise.resolve(response);
                const Calendar = createCalendar(() => request);
                const calendar = new Calendar(config);

                return calendar
                    .getEventsByTime("20210601T000000Z")
                    .then((response) => {
                        expect(response).to.be.an("array");
                        expect(response).to.have.lengthOf(44);
                        expect(response[0]).to.have.property("ics");
                        expect(response[0]).to.have.property("etag");
                        expect(response[0]).to.have.property("data");
                    });
            });
        });

        describe("recurring events that never end", () => {
            it("should expand upto end date if provided", () => {
                const response = fixtures.getRecurringEventsEndNeverResponse;
                const request = Promise.resolve(response);
                const Calendar = createCalendar(() => request);
                const calendar = new Calendar(config);

                return calendar
                    .getEventsByTime("20210601T000000Z", "20210630T000000Z")
                    .then((response) => {
                        expect(response).to.be.an("array");
                        expect(response).to.have.lengthOf(22);
                        expect(response[0]).to.have.property("ics");
                        expect(response[0]).to.have.property("etag");
                        expect(response[0]).to.have.property("data");
                    });
            });

            it("should expand only 10 upcoming events if end date is not provided", () => {
                const response = fixtures.getRecurringEventsEndNeverResponse;
                const request = Promise.resolve(response);
                const Calendar = createCalendar(() => request);
                const calendar = new Calendar(config);

                return calendar
                    .getEventsByTime("20210601T000000Z")
                    .then((response) => {
                        expect(response).to.be.an("array");
                        expect(response).to.have.lengthOf(10);
                        expect(response[0]).to.have.property("ics");
                        expect(response[0]).to.have.property("etag");
                        expect(response[0]).to.have.property("data");
                    });
            });
        });
    });
});
