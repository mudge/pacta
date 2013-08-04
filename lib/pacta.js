/*global module, define, process, setImmediate, setTimeout */
(function (name, context, definition) {
    'use strict';

    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else if (typeof define === 'function' && define.amd) {
        define(definition);
    } else {
        context[name] = definition();
    }
}('Promise', this, function () {
    'use strict';

    var nextTick, indexOf, EventEmitter, Promise, thenable, reduce;

    if (typeof Array.prototype.reduce !== 'function') {
        reduce = function (array, callback, initialValue) {
            var i, value, length = array.length, isValueSet = false;

            if (arguments.length > 2) {
                value = initialValue;
                isValueSet = true;
            }

            for (i = 0; i < length; i += 1) {
                if (array.hasOwnProperty(i)) {
                    if (isValueSet) {
                        value = callback(value, array[i], i, array);
                    } else {
                        value = array[i];
                        isValueSet = true;
                    }
                }
            }

            return value;
        };
    } else {
        reduce = function (array) {
            return Array.prototype.reduce.apply(array, [].slice.call(arguments, 1));
        };
    }

    /* Polyfill process.nextTick. */
    if (typeof process === 'object' && process &&
            typeof process.nextTick === 'function') {
        nextTick = process.nextTick;
    } else if (typeof setImmediate === 'function') {
        nextTick = setImmediate;
    } else {
        nextTick = function (f) {
            setTimeout(f, 0);
        };
    }

    /* Polyfill Array#indexOf. */
    if (typeof Array.prototype.indexOf === 'function') {
        indexOf = function (haystack, needle) {
            return haystack.indexOf(needle);
        };
    } else {
        indexOf = function (haystack, needle) {
            var i = 0, length = haystack.length, idx = -1, found = false;

            while (i < length && !found) {
                if (haystack[i] === needle) {
                    idx = i;
                    found = true;
                }

                i += 1;
            }

            return idx;
        };
    }


    /* Polyfill EventEmitter. */
    EventEmitter = function () {
        this.events = {};
    };

    EventEmitter.prototype.on = function (event, listener) {
        if (typeof this.events[event] !== 'object') {
            this.events[event] = [];
        }

        this.events[event].push(listener);
    };

    EventEmitter.prototype.removeListener = function (event, listener) {
        var idx;

        if (typeof this.events[event] === 'object') {
            idx = indexOf(this.events[event], listener);

            if (idx > -1) {
                this.events[event].splice(idx, 1);
            }
        }
    };

    EventEmitter.prototype.emit = function (event) {
        var i, listeners, length, args = [].slice.call(arguments, 1);

        if (typeof this.events[event] === 'object') {
            listeners = this.events[event].slice();
            length = listeners.length;

            for (i = 0; i < length; i += 1) {
                listeners[i].apply(this, args);
            }
        }
    };

    EventEmitter.prototype.once = function (event, listener) {
        this.on(event, function g() {
            this.removeListener(event, g);
            listener.apply(this, arguments);
        });
    };

    /* A Promise. */
    Promise = function (value) {
        this.emitter = new EventEmitter();
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
            nextTick(function () {
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
            nextTick(function () {
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
            return reduce.apply(null, [x].concat(args));
        });
    };

    /* Determine whether a value is "thenable" in Promises/A+ terminology. */
    thenable = function (x) {
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

    return Promise;
}));
