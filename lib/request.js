"use strict";

const doRequest = require("request");
const nodefn = require("when/node");
const _ = require("lodash");
const version = require("../package.json").version;

/**
 *
 * @param {Object} baseConfig
 * @param {Function} method
 * @param {string} depth
 * @param {string} xml
 * @returns {Promise}
 */
function request(baseConfig, method, depth, xml) {
    const config = _.assign({}, baseConfig);

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
    config.timeout = baseConfig.timeout ? baseConfig.timeout : 10;

    return nodefn.call(doRequest, config)
        .spread((res, body) => {
            let err;

            if (res.statusCode >= 300) {
                err = new Error("Response with status code: " + res.statusCode);
                err.statusCode = res.statusCode;
                throw err;
            }

            return body;
        })
        .catch((err) => {
            console.log(err);
            return '<?xml version="1.0"?><d:error>Timeout error</d:error>';
        });
}

module.exports = request;
