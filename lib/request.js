const fetch = require("cross-fetch");
const version = require("../package.json").version;

/**
 *
 * @param {object} baseConfig
 * @param {Function} method
 * @param {string} depth
 * @param {string} xml
 * @returns {Promise}
 */
function request(baseConfig, method, depth, xml) {
    const config = {
        headers: {
            authorization: `Basic ${Buffer.from(
                `${baseConfig.auth?.user}:${baseConfig.auth?.pass}`
            ).toString("base64")}`,
            ...baseConfig.headers,
            "Content-length": xml.length,
            Depth: depth,
        },
        body: xml,
        method,
        timeout: baseConfig.timeout ? baseConfig.timeout : 10000,
    };

    if (!baseConfig.headers || "User-Agent" in baseConfig.headers === false) {
        config.headers["User-Agent"] = "scrapegoat/" + version;
    }

    return fetch(baseConfig.uri, config)
        .then((res) => {
            if (!res.ok || res.status >= 300) {
                const err = new Error(
                    `Response with status code: ${res.status}`
                );

                err.statusCode = res.status;

                throw err;
            }

            return res.text();
        })
        .catch((err) => {
            throw err;
        });
}

module.exports = request;
