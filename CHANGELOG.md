# 0.1.4

- Fix: .getEvents() now returns correctly formatted objects with details about passed in events
- Fix: .getAllEvents() now returns correctly formatted objects containing all events in the calendar
- Fix: .getEventsByTime() now returns all upcoming events from today if you leave out start and end params
- Added url, uid, location, geo and description fields to the output of .getEvents(), .getAllEvents() and .getEventsByTime()
- Added tests for the Calendar

# 0.2.0

- Fix: Update the events parser to expand recurring events (Switched from using [ical](https://github.com/peterbraden/ical.js) to using [ical.js](https://github.com/mozilla-comm/ical.js)) - Fixes #12
- Fix: Handle cases where user inputs an end-date smaller than start-date in .getEventsByTime()
- Added `duration` and `type` fields to the output of .getEvents(), .getAllEvents() and .getEventsByTime()
- Removed `url` and `geo` fields from the output of .getEvents(), .getAllEvents() and .getEventsByTime() as most calendar clients do not allow users to provide these values
- Update calendar tests

# 0.2.1
- Fix: Remove wrappedJSObject circular object from event duration object

# 0.2.2
- Fix: Filter out recurring event occurrences from the past in `.getEventsByTime()`
- Fix: CalDav saves the end date of all day events as the start of the next day. To fix this, we now subtract one second from the end date.

# 0.2.3
- Fix: Solve bug where currently ongoing non-recurring events were being filtered out by `.getEventsByTime()`

# 0.3.0
- Feature: An optional `timeout` parameter can be provided to the `config` object passed to `Scrapegoat` to indicate the number of milliseconds to wait for the server to send the response before aborting the request.

# 0.4.0
- fix(parser): convert dates to ISO-Strings

    Return all dates (`start`, `end`, and `createdAt`) as ISO-Strings,
    instead of Date objects to maintain consistency.

    BREAKING CHANGE:

    The dates were returned as a mix of ISO-Strings and Date Objects
    in previous versions.

    To migrate your project, confirm that you are handling the dates
    received from scrapegoat correctly.
- fix(parser): remove etag trailing double quote
- docs(readme): update docs on README.md
