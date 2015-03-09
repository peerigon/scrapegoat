'use strict';

var expect = require('chai').expect;
var rewire = require('rewire');
var request = require('request');

var receiver = rewire('../../../lib/caldav/receiver');

describe('receiver', function () {

    describe('receiver.getChangedCalendar()', function () {

        before(function () {
            receiver.__set__('request', function(options, callback) {
                setImmediate(callback, new Error);
            });
        });

        it('should throw an error if there\'s no connection', function() {

            return receiver.getChangedCalendar().catch(function (error) {
                expect(error).to.be.instanceof(Error);
            });

        });

        after(function () {
            receiver.__set__('request', request);
        });

    });

    describe('receiver.getChangedEvents()', function () {

        before(function() {
            receiver.__set__('request', function(options, callback) {
                setImmediate(callback, new Error);
            });
        });

        it('should throw an error if there\'s no connection', function() {

            return receiver.getChangedCalendar().catch(function (error) {
                expect(error).to.be.instanceof(Error);
            });
        });

        after(function () {
            receiver.__set__('request', request);
        })
    });

});