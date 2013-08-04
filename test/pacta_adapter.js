'use strict';

/* An adapter for the Promises/A+ compatibility suite. */
var Promise = require('../lib/pacta');

exports.fulfilled = function (value) {
    return Promise.of(value);
};

exports.rejected = function (reason) {
    var promise = new Promise();
    promise.reject(reason);

    return promise;
};

exports.pending = function () {
    return {
        promise: new Promise(),
        fulfill: function (value) {
            this.promise.resolve(value);
        },
        reject: function (reason) {
            this.promise.reject(reason);
        }
    };
};
