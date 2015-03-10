# scrapegoat

This library requests a calendar object and its events provided by a CalDav server.

You have to specify a basic configuration.
```javascript
config = {
   user: 'username',
   pass: 'password',
   uri: 'http://example.com/cal.php/calendars/user/calendar_name'
}
```

#### Fetch a calendar and its ctag
`Receiver.getCalenderWithCtag()`

The ctag is used to determine if anything in the calendar has changed. The advantage is, that we do not have to fetch the whole calendar but only the ctag (saves traffic).
You can do something like this:
```javascript
var rec = new Receiver(config);
rec.getCalendarWithCtag().then(console.log);
```
You will get:
```javascript
{
   href: '/cal.php/calendars/test/holidays/',
   name: 'Holiday',
   ctag: '452'
}
```
Now you can compare the ctag with your local storage.

#### Fetch events with their etags
`Receiver.getEventsWithEtag()`

The etag on events is the same as the ctag on calendars.
Do something like this:
```javascript
var rec = new Receiver(config);
rec.getEventsWithEtag().then(console.log);
```
You will get:
```javascript
[
   {
      ics: '/cal.php/calendars/test/holidays/6151613161614616.ics',
      etag: 'fc46dd304e83f572688c68ab63816c8f"'
   },
   {
      ics: '/cal.php/calendars/test/holidays/6816189165131651.ics',
      etag: '8d59671ba294af1de0e0b154a8ea64c2"'
   }
]
```

Again, compare your local storage with the fetched events' etags and, for example, sort them in categories like `new`, `modified`, `unchanged`.

#### Fetches event details
`Receiver.getEvents(events)`

Fetches event details from events specified in `events`. `events` has to look like the result you get with `Receiver.getEventsWithEtag()` otherwise you will get an error.
Do something like this:
```javascript
rec.getEventsWithEtag().then(function (events) {
    rec.getEvents(events).then(console.log);
});
```
And get something like this:
```javascript
[
    {
        ics: '/cal.php/calendars/test/holidays/1234564316516.ics',
        etag: 'fc46dd304e83f572688c68ab63816c8f"',
        data: {
            title: 'Holiday: John Doe',
            description: undefined,
            start: Wed Jul 08 2015 00:00:00 GMT+0200 (CEST),
            end: Sat Aug 08 2015 00:00:00 GMT+0200 (CEST),
            createdAt: Wed Mar 04 2015 18:09:02 GMT+0100 (CET)
        } 
    }
]
```

