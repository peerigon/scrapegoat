'use strict';

var expect = require('chai').expect;
var rewire = require('rewire');
var doRequest = require('request');
var request = rewire('../../../lib/request');

var Scrapegoat = require('../../../lib');

var rec = new Scrapegoat({
    auth: {
        user: 'user',
        pass: 'password'
    },
    uri: '/calendars/user/calendar_name/'
});

describe('Scrapegoat', function () {

    describe('request(baseConfig, method, depth, xml)', function () {

        before(function () {
            request.__set__('doRequest', function (options, callback) {
                setImmediate(callback, new Error);
            });
        });

        it.only('should throw an error if there\'s no connection', function () {

            return rec.getCtag().catch(function (error) {
                expect(error).to.be.instanceof(Error);
            });

        });

        after(function () {
            request.__set__('doRequest', doRequest);
        });

    });

});