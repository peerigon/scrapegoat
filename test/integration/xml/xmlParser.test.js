'use strict';

var expect = require('chai').expect;
var xmlParser = require('../../../lib/caldav/xml/xmlParser');

describe('xmlParser', function () {

    describe('xmlParser.parseCalendarMultistatus(xml)', function() {

        it('should return an empty object when given invalid xml', function() {

            var xml = '<malformed>xml</malformed>';

            return xmlParser.parseCalendarMultistatus(xml).then(function(result) {
                expect(result).to.be.empty;
            });
        });

        it('should return an calendar object when given valid xml', function() {

            var xml = '<d:multistatus xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/"><d:response><d:href>/cal.php/calendars/test/urlaub/</d:href><d:propstat><d:prop><d:displayname>Urlaub</d:displayname><cs:getctag>3145</cs:getctag></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>';

            return xmlParser.parseCalendarMultistatus(xml).then(function (result) {
                expect(result).to.have.all.keys(['href', 'name', 'ctag']);
                expect(result.href).to.eql('/cal.php/calendars/test/urlaub/');
                expect(result.name).to.eql('Urlaub');
                expect(result.ctag).to.eql('3145');
            });
        });
    });

    describe('xmlParser.parseEventsMultistatus(xml)', function() {

        it('should return a non-empty array if xml contains events', function() {

            var xml = '<d:multistatus xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/"><d:response><d:href>/cal.php/calendars/test/urlaub/66CCF514-A71B-47C1-93D7-AD5D3D169047.ics</d:href><d:propstat><d:prop><d:getetag>"fc46dd304e83f572688c68ab63816c8f"</d:getetag></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>';

            return xmlParser.parseEventsMultistatus(xml).then(function (result) {
                expect(result).to.be.instanceof(Array);
                expect(result).to.have.length.above(0);
            });
        });

        it('should return an empty array if xml contains no events', function() {

            var xml = '<d:multistatus xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/"></d:multistatus>';

            return xmlParser.parseEventsMultistatus(xml).then(function (result) {
                expect(result).to.be.instanceof(Array);
                expect(result).to.be.empty;
            });
        });

        it('should return an empty array if xml is malformed', function() {

            var xml = '<malformed>xml</malformed>';

            return xmlParser.parseEventsMultistatus(xml).then(function (result) {
                expect(result).to.be.instanceof(Array);
                expect(result).to.be.empty;
            });
        });

    });

});