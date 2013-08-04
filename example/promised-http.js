var http = require('http'),
    Promise = require('../lib/pacta');

var get = function (options) {
    var promise = new Promise();

    http.get(options, function (res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            promise.resolve(body);
        });
    });

    return promise;
};

var getJSON = function (options) {
    return get(options).map(JSON.parse);
};

exports.get = get;
exports.getJSON = getJSON;
