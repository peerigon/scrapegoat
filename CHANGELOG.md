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
