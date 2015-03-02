"use strict";

var path = require('path');
var fs = require('fs');
var when = require('when');
var request = require('request');

function receive_caldav_data(xml, http_method, depth) {

    // TODO: write readFileSync async like
    // TODO: make it possible to parse for more than 1 calendar (lower priority)

    // build config
    var configFile = path.resolve(__dirname + '/config.json');
    var xmlFile = path.resolve(__dirname + '/xml/' + xml + '.xml');

    var config = JSON.parse(fs.readFileSync(configFile, 'utf-8')).caldav;

    // we have to set some missing parameters
    config.body = fs.readFileSync(xmlFile, 'utf-8');
    config.method = http_method;
    config.headers['Content-length'] = config.body.length;
    config.headers.Depth = depth;

    // do CalDav request, now!
    return when.promise(function (resolve, reject) {

        request(config, function (err, res, body) {

            if (err) {
                reject(err);
                return;
            }

            if (res.statusCode > 300) {
                reject(new Error('Response with status code: ' + res.statusCode));
                return;
            }

            resolve(body);
        });
    });
}

module.exports = receive_caldav_data;