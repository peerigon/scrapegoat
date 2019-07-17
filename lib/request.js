"use strict";

const { promisify } = require("util");
const doRequest = require("request");
const doRequestAsync = promisify(doRequest);
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
        ...baseConfig,
        headers: {
            ...baseConfig.headers,
            "Content-length": xml.length,
            Depth: depth
        },
        body: xml,
        method
    };

    if (!baseConfig.headers || "User-Agent" in baseConfig.headers === false) {
        config.headers["User-Agent"] = "scrapegoat/" + version;
    }

    if (baseConfig.auth) {
        config.auth = {
            ...baseConfig.auth
        };
    }

    config.timeout = baseConfig.timeout ? baseConfig.timeout : 10000;

    return doRequestAsync(config)
        .then(({ statusCode, body }) => {
            if (statusCode >= 300) {
                const err = new Error(
                    "Response with status code: " + statusCode
                );

                err.statusCode = statusCode;

                throw err;
            }

            return body;
        })
        .catch(err => {
            throw err;
        });
}

module.exports = request;
