'use strict';

var events = require('events');

var Promise = function (value) {
    this.emitter = new events.EventEmitter();
    this.resolved = false;
    this.rejected = false;

    if (arguments.length) {
        this.resolve(value);
    }
};

/* Populate a promise with its final value. */
Promise.prototype.resolve = Promise.prototype.fulfill = function (x) {
    if (this.state() === 'pending') {
        this.value = x;
        this.resolved = true;
        this.emitter.emit('resolved', x);
    }
};

/* Reject a promise, populating it with a reason. */
Promise.prototype.reject = function (reason) {
    if (this.state() === 'pending') {
        this.reason = reason;
        this.rejected = true;
        this.emitter.emit('rejected', reason);
    }
};

/* Return a promise's current state. */
Promise.prototype.state = function () {
    var result;

    if (this.resolved) {
        result = 'fulfilled';
    } else if (this.rejected) {
        result = 'rejected';
    } else {
        result = 'pending';
    }

    return result;
};

/* onRejected :: Promise a -> (a -> b) -> Promise b */
Promise.prototype.onRejected = function (f) {
    var promise = new Promise(),
        reason = this.reason;

    if (this.rejected) {
        process.nextTick(function () {
            promise.resolve(f(reason));
        });
    } else {
        this.emitter.once('rejected', function (reason) {
            promise.resolve(f(reason));
        });
    }

    return promise;
};

/* map :: Promise a -> (a -> b) -> Promise b */
Promise.prototype.map = function (f) {
    var promise = new Promise(),
        value   = this.value;

    if (this.resolved) {
        process.nextTick(function () {
            promise.resolve(f(value));
        });
    } else {
        this.emitter.once('resolved', function (x) {
            promise.resolve(f(x));
        });
    }

    return promise;
};

/* chain :: Promise a -> (a -> Promise b) -> Promise b */
Promise.prototype.chain = function (f) {
    var promise = new Promise();

    /* Map over the given Promise a with (a -> Promise b), returning a new
     * Promise (Promise b). Map over that, thereby gaining access to the inner
     * Promise b. Map over that in order to get to the inner value of b and
     * resolve another promise with it. Return that promise as it is equivalent
     * to Promise b.
    */
    this.map(f).map(function (x) {
        x.map(function (y) {
            promise.resolve(y);
        });
    });

    return promise;
};

/* concat :: Promise a -> Promise a */
Promise.prototype.concat = function (other) {
    var promise = new Promise();

    this.map(function (x) {
        other.map(function (y) {
            promise.resolve(x.concat(y));
        });
    });

    this.onRejected(function (reason) {
        promise.reject(reason);
    });

    other.onRejected(function (reason) {
        promise.reject(reason);
    });

    return promise;
};

/* ap :: Promise (a -> b) -> Promise a -> Promise b */
Promise.prototype.ap = function (m) {
    return this.chain(function (f) {
        return m.map(f);
    });
};

/* empty :: Promise a -> Promise a */
Promise.prototype.empty = function () {
    return Promise.of(this.value.empty ? this.value.empty() : this.value.constructor.empty());
};

/* conjoin :: Promise a   -> Promise b   -> Promise [a b]
 * conjoin :: Promise a   -> Promise [b] -> Promise [a b]
 * conjoin :: Promise [a] -> Promise b   -> Promise [a b]
 * conjoin :: Promise [a] -> Promise [b] -> Promise [a b]
 */
Promise.prototype.conjoin = function (other) {
    var wrap = function (x) { return [].concat(x); };

    return this.map(wrap).concat(other.map(wrap));
};

/* append :: Promise [a] -> Promise b -> Promise [a b] */
Promise.prototype.append = function (other) {
    return this.concat(other.map(function (x) {
        return [x];
    }));
};

/* spread :: Promise a -> (a -> b) -> Promise b */
Promise.prototype.spread = Promise.prototype.explode = function (f) {
    return this.map(function (x) {
        return f.apply(null, x);
    });
};

Promise.prototype.reduce = function () {
    var args = [].slice.call(arguments);

    return this.map(function (x) {
        return x.reduce.apply(x, args);
    });
};

/* Determine whether a value is "thenable" in Promises/A+ terminology. */
var thenable = function (x) {
    return x !== null && typeof x === 'object' &&
        typeof x.then === 'function';
};

/* Compatibility with the Promises/A+ specification. */
Promise.prototype.then = function (onFulfilled, onRejected) {
    var promise = new Promise();

    if (typeof onFulfilled === 'function') {
        this.map(function (x) {
            try {
                var value = onFulfilled(x);

                if (thenable(value)) {
                    value.then(function (x) {
                        promise.resolve(x);
                    }, function (reason) {
                        promise.reject(reason);
                    });
                } else {
                    promise.resolve(value);
                }
            } catch (e) {
                promise.reject(e);
            }
        });
    } else {
        this.map(function (x) {
            promise.resolve(x);
        });
    }

    if (typeof onRejected === 'function') {
        this.onRejected(function (reason) {
            try {
                reason = onRejected(reason);

                if (thenable(reason)) {
                    reason.then(function (x) {
                        promise.resolve(x);
                    }, function (reason) {
                        promise.reject(reason);
                    });
                } else {
                    promise.resolve(reason);
                }
            } catch (e) {
                promise.reject(e);
            }
        });
    } else {
        this.onRejected(function (reason) {
            promise.reject(reason);
        });
    }

    return promise;
};

/* of :: a -> Promise a */
Promise.of = function (x) {
    return new Promise(x);
};

/* A Monoid interface for Array. */
Array.empty = function () {
    return [];
};

/* A Monoid interface for String. */
String.empty = function () {
    return '';
};

exports.Promise = Promise;
