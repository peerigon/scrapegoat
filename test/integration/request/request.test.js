
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
};

describe("Request", () => {
    it("should call request with the correct headers", done => {
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

        calendar.getCtag().catch(() => {
            // There will be an error because of the code in request we arent testing for
            expect(calendarRequest.isDone()).to.equal(true);
            done();
        });
    });
});
