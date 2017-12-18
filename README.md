# scrapegoat

[![Build Status](https://travis-ci.org/peerigon/scrapegoat.svg?branch=develop)](https://travis-ci.org/peerigon/scrapegoat)
[![Dependency Status](https://david-dm.org/peerigon/scrapegoat.svg)](https://david-dm.org/peerigon/scrapegoat)

This library requests a calendar object and its events provided by a CalDav server.

Specify basic configuration:

```javascript
config = {
  auth: {
   user: 'username',
   pass: 'password'
 },
 // example using baikal as CalDAV server
 uri: 'http://example.com/cal.php/calendars/<user name>/<calendar name>'
}
```

The request will timeout if it gets no reponse from the CalDav server after 10 seconds.
An optional `timeout` parameter can be provided to override this default by passing an integer containing the number of milliseconds to wait for the server to send the response before aborting the request.

```javascript
config = {
    auth: {
        user: 'username',
        pass: 'password'
    },
    // example using baikal as CalDAV server
    uri: 'http://example.com/cal.php/calendars/<user name>/<calendar name>',
    timeout: 20000
}
```

API
---

### scrapegoat.getCtag()

Fetches the ctag of a calendar. You can use the calendar's ctag to see if anything in the calendar has changed.

```javascript
const Scrapegoat = require('scrapegoat');

const scrapegoat = new Scrapegoat(config);

scrapegoat.getCtag().then(console.log);
```

You'll get an object, which looks like this:

```javascript
{
   href: '/cal.php/calendars/test/holidays/',
   name: 'Holiday',
   ctag: '452'
}
```

### scrapegoat.getEtags()

Fetches the etags of a all events. You can use the events etags to see if an event has changed.

```javascript
scrapegoat.getEtags().then(console.log);
```

You'll get an array of objects, which looks like this:

```javascript
[
   {
      ics: '/cal.php/calendars/test/holidays/6151613161614616.ics',
      etag: 'fc46dd304e83f572688c68ab63816c8f'
   },
   {
      ics: '/cal.php/calendars/test/holidays/6816189165131651.ics',
      etag: '8d59671ba294af1de0e0b154a8ea64c2'
   }
]
```

### scrapegoat.getEvents(events)

Fetches events with its data/details. `events` has to be an array with objects, which contain an ics attribute. The ics attribute has to look like the ones we get with `getEtags()`.

```javascript
const events = [
  { ics: '/cal.php/calendars/user/calendar_name/12345.ics' }
  { ics: '/cal.php/calendars/user/calendar_name/67890.ics' }
];

scrapegoat.getEvents(events).then(console.log);
```

Output should be something like this:

```javascript
[
    {
        ics: '/cal.php/calendars/test/holidays/1234564316516.ics',
        etag: 'fc46dd304e83f572688c68ab63816c8f',
        data: {
            title: 'Holiday: John Doe',
            uid: '56ea42c0-e4af-4ac8-8d60-d95996c9ddc5',
            location: 'Kissing, Augsburg, Germany',
            description: null,
            start: '2017-02-16T00:00:00.000Z',
            end: '2017-02-18T00:00:00.000Z',
            duration: {
                weeks: 0,
                days: 2,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isNegative: false
            },
            type: { recurring: false, edited: false },
            createdAt: '2017-01-24T15:33:04.000Z'
        }
    }
]
```

### scrapegoat.getAllEvents()

Fetches all events of the given calendar with data/details.

### scrapegoat.getEventsByTime(start, end)

Fetch all events which occur between `start` and `end` (have to be valid [iCal Dates](http://www.kanzaki.com/docs/ical/dateTime.html)).
If you leave `start` and `end` out, you'll get all upcoming events from today.
Passing only one date as a parameter returns all upcoming events from that date.
The end-date must be larger that the start-date.

Example using [moment.js](http://momentjs.com/) for date formatting:

```javascript
const moment = require('moment');

const start = moment().startOf('month').format('YYYYMMDD[T]HHmmss[Z]');
const end =  moment().endOf('month').format('YYYYMMDD[T]HHmmss[Z]');

scrapegoat.getEventsByTime(start, end).then(console.log);
```

The example below gets all events happening on a single day

```javascript
const moment = require('moment');

const start = moment("20170216T0000").format("YYYYMMDD[T]HHmmss[Z]");
const end = moment("20170216T2300").format("YYYYMMDD[T]HHmmss[Z]");

scrapegoat.getEventsByTime(start, end).then(console.log);
```

## Sponsors

[<img src="https://assets.peerigon.com/peerigon/logo/peerigon-logo-flat-spinat.png" width="150" />](https://peerigon.com)
