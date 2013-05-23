var events = require('events');

var Promise = function (value) {
    this.emitter = new events.EventEmitter();
    this.resolved = false;

    /* Promise a -> (a -> b) -> Promise b */
    this.map = function (f) {
        var promise = new Promise();

        if (this.resolved) {
            promise.resolve(f.apply(null, this.value));
        } else {
            this.emitter.on('resolved', function () {
                var x = f.apply(null, [].slice.call(arguments));
                promise.resolve(x);
            });
        }

        return promise;
    };

    /* Promise a -> Promise b -> Promise [a b] */
    this.concat = function (other) {
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

    this.resolve = function () {
        var values = [].slice.call(arguments);
        this.value = values;
        this.resolved = true;
        this.emitter.emit.apply(this.emitter, ['resolved'].concat(values));
    };

    if (typeof value !== 'undefined') {
        this.resolve(value);
    }
};

exports.Promise = Promise;
