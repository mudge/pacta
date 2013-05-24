var events = require('events');

var Promise = function (value) {
    this.emitter = new events.EventEmitter();
    this.resolved = false;

    if (typeof value !== 'undefined') {
        this.resolve(value);
    }
};

/* Populate a promise with its final value. */
Promise.prototype.resolve = function () {
    var values = [].slice.call(arguments);
    this.value = values;
    this.resolved = true;
    this.emitter.emit.apply(this.emitter, ['resolved'].concat(values));
};

/* map :: Promise a -> (a -> b) -> Promise b */
Promise.prototype.map = function (f) {
    var promise = new Promise();

    if (this.resolved) {
        promise.resolve(f.apply(null, this.value));
    } else {
        this.emitter.once('resolved', function () {
            var x = f.apply(null, [].slice.call(arguments));
            promise.resolve(x);
        });
    }

    return promise;
};

/* chain :: Promise a -> (a -> Promise b) -> Promise b */
Promise.prototype.chain = function (f) {
    if (this.resolved) {
        return f.apply(null, this.value);
    } else {
        var promise = new Promise();

        /* Map over the given Promise a with (a -> Promise b), returning
         * a new Promise (Promise b). Map over that, thereby gaining access to
         * the inner Promise b. Map over that in order to get to the inner value
         * of b and resolve another promise with it. Return that promise as
         * it is equivalent to Promise b.
         */
        this.map(f).map(function (x) {
            x.map(function (y) {
                promise.resolve(y);
            });
        });

        return promise;
    }
};

/* concat :: Promise a -> Promise b -> Promise [a b]
 * concat :: Promise [a b] -> Promise c -> Promise [a b c]
 */
Promise.prototype.concat = function (other) {
    var promise = new Promise();

    this.map(function () {
        var args = [].slice.call(arguments);

        other.map(function () {
            var otherArgs = [].slice.call(arguments);

            promise.resolve.apply(promise, args.concat(otherArgs));
        });
    });

    return promise;
};

/* ap :: Promise (a -> b) -> Promise a -> Promise b */
Promise.prototype.ap = function (m) {
    return this.chain(function (f) {
        return m.map(f);
    });
};

/* of :: a -> Promise a */
Promise.of = function (x) {
    return new Promise(x);
};

Promise.empty = function () {
    var promise = new Promise();
    promise.resolve();

    return promise;
};

exports.Promise = Promise;
