var events = require('events');

var Promise = function (value) {
    this.emitter = new events.EventEmitter();
    this.resolved = false;

    if (typeof value !== 'undefined') {
        this.resolve(value);
    }
};

/* Promise a -> (a -> b) -> Promise b */
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

/* Promise a -> (a -> Promise b) -> Promise b */
Promise.prototype.chain = function (f) {
    if (this.resolved) {
        return f.apply(null, this.value);
    } else {
        var promise = new Promise();

        /* Promise a -> (a -> Promise b) -> (Promise (Promise b)) -> (Promise b) */
        this.map(f).map(function (x) {
            x.map(function (y) {
                promise.resolve(y);
            });
        });

        return promise;
    }
};

/* Promise a -> Promise b -> Promise [a b] */
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

Promise.prototype.resolve = function () {
    var values = [].slice.call(arguments);
    this.value = values;
    this.resolved = true;
    this.emitter.emit.apply(this.emitter, ['resolved'].concat(values));
};

Promise.prototype.ap = function (m) {
    return this.chain(function (f) {
        return m.map(f);
    });
};

Promise.of = function (x) {
    return new Promise(x);
};

exports.Promise = Promise;
