var http = require('http'),
    Promise = require('../lib/pacta');

var get = function (options) {
    return new Promise(function (resolve, reject) {
        var request = http.get(options, function (res) {
            var body = '';

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
                resolve(body);
            });
        });

        request.on('error', function (e) {
            reject(e.message);
        });
    });
};

var getJSON = function (options) {
    return get(options).map(JSON.parse);
};

exports.get = get;
exports.getJSON = getJSON;
