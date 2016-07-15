"use strict";

var doRequest = require("request");
var nodefn = require("when/node");
var _ = require("lodash");
var version = require("../package.json").version;

/**
 *
 * @param {Object} baseConfig
 * @param {Function} method
 * @param {string} depth
 * @param {string} xml
 * @returns {Promise}
 */
function request(baseConfig, method, depth, xml) {
    var config;

    config = _.assign({}, baseConfig);
    config.headers = _.assign({}, baseConfig.headers);

    if (!baseConfig.headers || "User-Agent" in baseConfig.headers === false) {
        config.headers["User-Agent"] = "scrapegoat/" + version;
    }

    if (baseConfig.auth) {
        config.auth = _.assign({}, baseConfig.auth);
        config.auth.sendImmediately = "sendImmediately" in baseConfig.auth ? baseConfig.auth.sendImmediately : false;
    }

    config.body = xml;
    config.method = method;
    config.headers["Content-length"] = xml.length;
    config.headers.Depth = depth;

    return nodefn.call(doRequest, config)
        .spread(function (res, body) {
            var err;

            if (res.statusCode >= 300) {
                err = new Error("Response with status code: " + res.statusCode);
                err.statusCode = res.statusCode;
                throw err;
            }

            return body;
        });
}

module.exports = request;
