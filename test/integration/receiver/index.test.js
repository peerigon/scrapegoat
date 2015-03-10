'use strict';

var expect = require('chai').expect;
var rewire = require('rewire');
var request = require('request');

var Receiver = rewire('../../../lib');

var rec = new Receiver({
    user: 'test',
    pass: 'urlaub',
    uri: 'https://sepp.peerigon.com/cal.php/calendars/test/urlaub'
});

describe('receiver', function () {

    describe('receiver.getCalendarWithCtag()', function () {

        before(function () {
            Receiver.__set__('request', function (options, callback) {
                setImmediate(callback, new Error);
            });
        });

        it('should throw an error if there\'s no connection', function () {

            return rec.getCalendarWithCtag().catch(function (error) {
                expect(error).to.be.instanceof(Error);
            });

        });

        after(function () {
            Receiver.__set__('request', request);
        });

    });

    describe('receiver.getEventsWithEtag()', function () {

        before(function () {
            Receiver.__set__('request', function (options, callback) {
                setImmediate(callback, new Error);
            });
        });

        it('should throw an error if there\'s no connection', function () {

            return rec.getEventsWithEtag().catch(function (error) {
                expect(error).to.be.instanceof(Error);
            });
        });

        after(function () {
            Receiver.__set__('request', request);
        })
    });

    describe('receiver.getEvents(events)', function () {

        before(function () {
            Receiver.__set__('request', function (options, callback) {
                setImmediate(callback, new Error);
            });
        });

        it('should throw an error if there\'s no connection', function () {

            return rec.getEvents([]).catch(function (error) {
                expect(error).to.be.instanceof(Error);
            });
        });

        after(function () {
            Receiver.__set__('request', request);
        })
    })

});