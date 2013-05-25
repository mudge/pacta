var http = require('http'),
    Promise = require('../lib/pacta').Promise;

var get = function (url) {
    var promise = new Promise();

    http.get(url, function (res) {
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

var getJSON = function (url) {
    return get(url).map(JSON.parse);
};

exports.get = get;
exports.getJSON = getJSON;
