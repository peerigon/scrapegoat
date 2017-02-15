// process.env.TZ = "Africa/Nairobi";

const Scrapegoat = require("./index");
// const moment = require("moment");

// const start = moment("20170209T0000").format("YYYYMMDD[T]HHmmss[Z]");
// const end = moment("20170209T2300").format("YYYYMMDD[T]HHmmss[Z]");
const config = {
    auth: {
        user: "antosan",
        pass: "be-together"
    },
    uri: "http://127.0.0.1/cal.php/calendars/antosan/default/"
};
const scrapegoat = new Scrapegoat(config);

// const events = [
//     { ics: "/cal.php/calendars/antosan/default/event1.ics" },
//     { ics: "/cal.php/calendars/antosan/default/event2.ics" },
//     { ics: "/cal.php/calendars/antosan/default/event3.ics" },
//     { ics: "/cal.php/calendars/antosan/default/event4.ics" },
//     { ics: "/cal.php/calendars/antosan/default/event5.ics" }
// ];

// scrapegoat.getEvents([{ ics: "/cal.php/calendars/antosan/default/56ea42c0-e4af-4ac8-8d60-d95996c9ddc5.ics" }]).then(events => {
scrapegoat.getEventsByTime("20170605T000000Z").then(events => {
// scrapegoat.getAllEvents().then(events => {
    events.forEach(event => {
        // console.log(event);
        console.log(event.data.title);
        console.log(event.data.start);
        console.log(event.data.end);
        console.log("\n");
    });
});