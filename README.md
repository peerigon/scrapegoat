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
