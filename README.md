# ical-sc(r)aper
ical holiday sc(r)apen

If you want to work with this source, do the following steps:

### sc(r)aper:

1. `git clone https://github.com/peerigon/ical-scaper`
2. `cd ical-scaper`
3. `npm install`
4. `vagrant up`
5. `vagrant ssh`
6. `cd /vagrant/src/ical-scraper` (consider the *r* in scraper)
7. `node index.js`

You should geht something like this:
```javascript
{ props: 
   { href: '/cal.php/calendars/test/urlaub/',
     name: 'Urlaub',
     ctag: '184' },
  events: 
   { new: 
      [ { ics: '037BAE0D-CB19-4B33-9376-52999F03AB0B.ics',
          etag: 'f86a9c1699d1a1ceb6dc4955dd4acc5a"' },
        { ics: 'A2425226-F445-4197-A35B-F872A1AC2AAF.ics',
          etag: '97d8131ef37cc23d6a0aea37e2e02ca8"' } ],
     modified: [],
     unchanged: [] } }
```

### lib/caldav

You need to specify a basic configuration.
```javascript
config = {
   user: 'username',
   pass: 'password',
   uri: 'http://example.com/cal.php/calendars/user/calendar_name'
}
```

#### fetching calendars' ctag `Receiver.getCalendarWithCtag()`
The ctag is used to determine if anything in the calendar has changed. The advantage is, that we do not have to fetch the whole calendar but only the ctag (saves traffic).
You can do something like this:
```javascript
var rec = new Receiver(config);
rec.getCalendarWithCtag().then(console.log);
```
You will get:
```javascript
{
   href: '/cal.php/calendars/test/urlaub/',
   name: 'Urlaub',
   ctag: '192'
}
```
Now you can compare the ctag with your local storage.

#### fetching events etag `Receiver.getEventsWithEtag()`
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
      ics: '/cal.php/calendars/test/urlaub/66CCF514-A71B-47C1-93D7-AD5D3D169047.ics',
      etag: 'fc46dd304e83f572688c68ab63816c8f"'
   },
   {
      ics: '/cal.php/calendars/test/urlaub/BB2F60B8-4B91-4370-9829-C3633335DAFC.ics',
      etag: '8d59671ba294af1de0e0b154a8ea64c2"'
   }
]
```

Again, compare your local storage with the fetched events' etags and sort them in categories like `new`, `modified`, `unchanged`.

#### fetching events details `Receiver.getEvents(events)`
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
        ics: '/cal.php/calendars/test/urlaub/66CCF514-A71B-47C1-93D7-AD5D3D169047.ics',
        etag: 'fc46dd304e83f572688c68ab63816c8f"',
        data: {
            title: 'Urlaub (MaJ)',
            description: undefined,
            start: Wed Jul 08 2015 00:00:00 GMT+0200 (CEST),
            end: Sat Aug 08 2015 00:00:00 GMT+0200 (CEST),
            createdAt: Wed Mar 04 2015 18:09:02 GMT+0100 (CET)
        } 
    }
]
```