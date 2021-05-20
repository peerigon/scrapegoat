
const fs = require("fs");
const path = require("path");

const fixtures = {
    getCtagResponse: fs.readFileSync(path.join(__dirname, "/ctag.response.xml"), "utf8"),
    getCtagNoNamespaceResponse: fs.readFileSync(path.join(__dirname, "/ctagNoNamespace.response.xml"), "utf8"),
    getEtagsResponse: fs.readFileSync(path.join(__dirname, "/etags.response.xml"), "utf8"),
    getEtagsNoNamespaceResponse: fs.readFileSync(path.join(__dirname, "/etagsNoNamespace.response.xml"), "utf8"),
    getEventsResponse: fs.readFileSync(path.join(__dirname, "/events.response.xml"), "utf8"),
    getAllEventsResponse: fs.readFileSync(path.join(__dirname, "/eventsAll.response.xml"), "utf8"),
    getAllEventsNoNamespaceResponse: fs.readFileSync(path.join(__dirname, "/eventsAllNoNamespace.response.xml"), "utf8"),
    getEventsByTimeResponse: fs.readFileSync(path.join(__dirname, "/eventsByTime.response.xml"), "utf8"),
    getFutureEventsResponse: fs.readFileSync(path.join(__dirname, "/eventsFuture.response.xml"), "utf8"),
    getRecurringEventsCountResponse: fs.readFileSync(path.join(__dirname, "/recurringEventsCount.response.xml"), "utf8"),
    getRecurringEventsUntilResponse: fs.readFileSync(path.join(__dirname, "/recurringEventsUntil.response.xml"), "utf8"),
    getRecurringEventsEndNeverResponse: fs.readFileSync(path.join(__dirname, "/recurringEventsEndNever.response.xml"), "utf8"),
};

module.exports = fixtures;
