const nock = require("nock");
const expect = require("chai").expect;
const createCalendar = require("../../../lib/Calendar");
const request = require("../../../lib/request");
const xml = require("../../../lib/xml");

const CALENDAR_DOMAIN = "http://example.com";
const CALENDAR_PATH = "/cal.php/calendars/user/calendar_name/";
const config = {
    auth: {
        user: "username",
        pass: "password",
    },
    uri: CALENDAR_DOMAIN + CALENDAR_PATH,
    events: {
        maxExpandCount: 10,
    },
};

describe("Request", () => {
    it("should call request with the correct headers", async () => {
        const calendarRequest = nock(CALENDAR_DOMAIN, {
            reqheaders: {
                "Content-length": xml.calendarCtag.length,
                Depth: 0,
                host: "example.com",
            },
        })
            .intercept(CALENDAR_PATH, "PROPFIND")
            .reply(200, {});

        const Calendar = createCalendar(request);
        const calendar = new Calendar(config);

        return calendar.getCtag().catch(() => {
            // There will be an error because of the code in request we arent testing for
            expect(calendarRequest.isDone()).to.equal(true);
        });
    });

    it("should throw if fetch response error is not 200 OK", async () => {
        nock(CALENDAR_DOMAIN, {
            reqheaders: {
                "Content-length": xml.calendarCtag.length,
                Depth: 0,
                host: "example.com",
            },
        })
            .intercept(CALENDAR_PATH, "PROPFIND")
            .reply(301, "301 Moved Permanently");

        const Calendar = createCalendar(request);
        const calendar = new Calendar({
            ...config,
            timeout: 20000,
            headers: {
                "User-Agent": "scrapegoat/1.0.0",
                authorization: `Basic 123456789`,
            },
        });

        return calendar.getCtag().catch((error) => {
            expect(error).to.have.property(
                "message",
                "Response with status code: 301"
            );
        });
    });

    it("should throw if there is a fetch error", async () => {
        nock(CALENDAR_DOMAIN, {
            reqheaders: {
                "Content-length": xml.calendarCtag.length,
                Depth: 0,
                host: "example.com",
            },
        })
            .intercept(CALENDAR_PATH, "PROPFIND")
            .replyWithError("something awful happened");

        const Calendar = createCalendar(request);
        const calendar = new Calendar(config);

        return calendar.getCtag().catch((error) => {
            expect(error).to.have.property(
                "message",
                "request to http://example.com/cal.php/calendars/user/calendar_name/ failed, reason: something awful happened"
            );
        });
    });
});
