const Scrapegoat = require("./lib");
const moment = require("moment");

const config = {
    auth: {
        user: "antosan",
        pass: "be-together"
    },
    // example using baikal as CalDAV server
    uri: "http://192.168.99.100/cal.php/calendars/antosan/default/"
};

const scrapegoat = new Scrapegoat(config);

const events = [
    { ics: "/cal.php/calendars/antosan/default/nodeschool-augsburg.ics" },
    { ics: "/cal.php/calendars/antosan/default/sampleevent.ics" },
    { ics: "/cal.php/calendars/antosan/default/importantevent.ics" }
];

/*
 scrapegoat.getCtag().then(console.log);
 scrapegoat.getEtags().then(console.log);
 scrapegoat.getEvents(events).then(console.log);
 scrapegoat.getAllEvents().then(console.log);
 */

const start = moment().startOf("month").format("YYYYMMDD[T]HHmmss[Z]");
const end = moment().endOf("month").format("YYYYMMDD[T]HHmmss[Z]");

scrapegoat.getEventsByTime().then(console.log);
// scrapegoat.getEventsByTime("20101231T235959Z", "20151231T235959Z").then(console.log);

// ================================================================================ //
// ================================================================================ //
// ================================================================================ //

const request = require("./lib/request");
const xml = require("./lib/xml");
const ejs = require("ejs");
const byTimeTemplate = ejs.compile(xml.byTime);
const multigetTemplate = ejs.compile(xml.multiget);

const xmlRequest = byTimeTemplate({ start, end });

// request(config, "REPORT", 1, xmlRequest).then(console.log);
// request(config, "REPORT", 1, xml.calendarQuery).then(console.log);
// request(config, "REPORT", 1, multigetTemplate({ gets: events })).then(console.log);
// request(config, "PROPFIND", 0, xml.calendarCtag).then(console.log);
// request(config, "PROPFIND", 0, xml.calendarCtag).then(console.log);
