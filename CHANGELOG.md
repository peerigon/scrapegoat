# 0.1.4

- Fix: .getEvents() now returns correctly formatted objects with details about passed in events
- Fix: .getAllEvents() now returns correctly formatted objects containing all events in the calendar
- Fix: .getEventsByTime() now returns all upcoming events from today if you leave out start and end params
- Added url, uid, location, geo and description fields to the output of .getEvents(), .getAllEvents() and .getEventsByTime()
- Added tests for the Calendar
