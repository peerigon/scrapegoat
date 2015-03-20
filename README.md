# scrapegoat

[![Build Status](https://travis-ci.org/peerigon/scrapegoat.svg?branch=develop)](https://travis-ci.org/peerigon/scrapegoat)
[![Dependency Status](https://david-dm.org/peerigon/scrapegoat.svg)](https://david-dm.org/peerigon/scrapegoat)

This library requests a calendar object and its events provided by a CalDav server.

**Note: This project is under active development. Things may change.**

Specify basic configuration:
```javascript
config = {
  auth: {
   user: 'username',
   pass: 'password'
 },
 uri: 'http://example.com/cal.php/calendars/user/calendar_name'
}
```

API
---

### Scrapegoat.getCtag()

Fetches the ctag of a calendar. You can use the calendars ctag to see if anything in the calendar has changed.

```javascript
var rec = new Scrapegoat(config);
rec.getCtag().then(console.log);
```

You'll get an object, which looks like this:
```javascript
{
   href: '/calendars/test/holidays/',
   name: 'Holiday',
   ctag: '452'
}
```

### Scrapegoat.getEtags()

Fetches the etags of a all events. You can use the events etags to see if an event has changed.

```javascript
rec.getEventsWithEtag().then(console.log);
```

You'll get an array of objects, which looks like this:
```javascript
[
   {
      ics: '/calendars/test/holidays/6151613161614616.ics',
      etag: 'fc46dd304e83f572688c68ab63816c8f'
   },
   {
      ics: '/calendars/test/holidays/6816189165131651.ics',
      etag: '8d59671ba294af1de0e0b154a8ea64c2'
   }
]
```

### Scrapegoat.getEvents(events)

Fetches events with its data/details. `events` has to be an array with objects, which contain an ics attribute. The ics attribute has to look like the ones we get with `getEtags()`.

```javascript
var events = [
  { ics: '/calendars/user/calendar_name/12345.ics' }
  { ics: '/calendars/user/calendar_name/67890.ics' }
];

rec.getEvents(events).then(console.log);
```
Output should be something like this:
```javascript
[
    {
        ics: '/calendars/test/holidays/1234564316516.ics',
        etag: 'fc46dd304e83f572688c68ab63816c8f"',
        data: {
            title: 'Holiday: John Doe',
            start: Wed Jul 08 2015 00:00:00 GMT+0200 (CEST),
            end: Sat Aug 08 2015 00:00:00 GMT+0200 (CEST),
            createdAt: Wed Mar 04 2015 18:09:02 GMT+0100 (CET)
        } 
    }
]
```

### Scrapegoat.getAllEvents()

Fetches all events of the given calendar with data/details.

### Scrapegoat.getEventsByTime(start, end)

Fetch all events which occur between `start` and `end` (have to be valid *iCal Dates*). If you leave `start` and `end` out, you'll get all events from today.

```javascript
var start = moment().startOf('month').format('YYYYMMDD[T]HHmmss[Z]');
var end =  moment().endOf('month').format('YYYYMMDD[T]HHmmss[Z]');

return rec.getEventsByTime(start, end).then(console.log);
```
