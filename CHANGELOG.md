# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.0.1"></a>
## [1.0.1](https://github.com/peerigon/scrapegoat/compare/v1.0.0...v1.0.1) (2019-09-06)


### Bug Fixes

* Add iCloud support ([#32](https://github.com/peerigon/scrapegoat/issues/32)) ([902b08f](https://github.com/peerigon/scrapegoat/commit/902b08f))



<a name="1.0.0"></a>
# 1.0.0 (2018-10-11)


### Bug Fixes

* **parser:** convert dates to ISO-Strings ([53c252f](https://github.com/peerigon/scrapegoat/commit/53c252f))
* **parser:** remove etag trailing double quote ([9b32f4b](https://github.com/peerigon/scrapegoat/commit/9b32f4b))


* Native promises (#26) ([44ba27d](https://github.com/peerigon/scrapegoat/commit/44ba27d)), closes [#26](https://github.com/peerigon/scrapegoat/issues/26)


### BREAKING CHANGES

* update Node version to v8.0.0
* **parser:** The dates were returned as a mix of ISO-Strings and Date Objects
in previous versions.

To migrate your project, confirm that you are handling the dates
received from scrapegoat correctly.



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
- Fix: Convert `start`, `end`, and `createdAt` dates to ISO-Strings instead of Date objects to maintain consistency.

    BREAKING CHANGE:

    The dates were returned as a mix of ISO-Strings and Date Objects in previous versions.

    To migrate your project, confirm that you are handling the dates received from scrapegoat correctly.
- Fix: Remove `etag` trailing double quote