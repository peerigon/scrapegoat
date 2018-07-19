"use strict";

const doRequest = require("request");
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
    const config = {
        headers: baseConfig.headers,
        body: xml,
        method,
        'headers["Content-length"]': xml.length,
        'headers["Depth"]': depth,
        ...baseConfig
    };

    if (!baseConfig.headers || "User-Agent" in baseConfig.headers === false) {
        config.headers["User-Agent"] = "scrapegoat/" + version;
    }

    if (baseConfig.auth) {
        config.auth = {
            sendImmediately:
                "sendImmediately" in baseConfig.auth ?
                    baseConfig.auth.sendImmediately :
                    false,
            ...baseConfig.auth
        };
    }

    config.timeout = baseConfig.timeout ? baseConfig.timeout : 10000;

    return new Promise((resolve, reject) => {
        doRequest(config, (res, body) => {
            let err;

            if (res.statusCode >= 300) {
                err = new Error("Response with status code: " + res.statusCode);
                err.statusCode = res.statusCode;
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
}

module.exports = request;
