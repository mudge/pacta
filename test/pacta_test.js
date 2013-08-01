/*global describe, it, beforeEach */
'use strict';

(function (context, test) {
    if (typeof context.assert === 'object' && typeof context.Promise === 'function') {
        test(context.assert, context.Promise);
    } else {
        test(require('assert'), require('../lib/pacta'));
    }
}(this, function (assert, Promise) {
    describe('Promise', function () {
        var p, p2, p3, p4;

        beforeEach(function () {
            p = new Promise();
            setTimeout(function () {
                p.resolve('foo');
            }, 50);

            p2 = new Promise();
            setTimeout(function () {
                p2.resolve('bar');
            }, 25);

            p3 = new Promise();
            setTimeout(function () {
                p3.resolve('baz');
            }, 75);
        });

        describe('.of', function () {
            it('wraps a value in a new promise', function (done) {
                Promise.of(1).map(function (x) {
                    assert.equal(1, x);
                    done();
                });
            });
        });

        describe('#state', function () {
            it('is pending for unfulfilled and unrejected promises', function () {
                p = new Promise();

                assert.equal('pending', p.state());
            });

            it('is fulfilled for fulfilled promises', function () {
                p = Promise.of(1);

                assert.equal('fulfilled', p.state());
            });

            it('is rejected for rejected promises', function () {
                p = new Promise();
                p.reject('error');

                assert.equal('rejected', p.state());
            });
        });

        describe('#resolve', function () {
            it('resolves a promise with its final value', function () {
                p = new Promise();
                p.resolve(1);

                assert.equal('fulfilled', p.state());
            });

            it('triggers any listeners for resolution', function (done) {
                var triggered = false;

                p = new Promise();
                p.map(function () {
                    triggered = true;
                    done();
                });

                p.resolve(1);

                assert.ok(triggered);
            });

            it('does nothing to rejected promises', function () {
                p = new Promise();
                p.reject('error');
                p.resolve(1);

                assert.equal('rejected', p.state());
            });

            it('does not trigger listeners if the promise is rejected', function () {
                var triggered = false;

                p = new Promise();
                p.reject('error');
                p.map(function () {
                    triggered = true;
                });
                p.resolve(1);

                assert.ok(!triggered);
            });
        });

        describe('#reject', function () {
            it('rejects a promise, setting a reason', function () {
                p = new Promise();
                p.reject('error');

                assert.equal('rejected', p.state());
            });

            it('does nothing to fulfilled promises', function () {
                p = Promise.of(1);
                p.reject('error');

                assert.equal('fulfilled', p.state());
            });

            it('triggers onRejected listeners', function (done) {
                var triggered = false;

                p = new Promise();
                p.onRejected(function () {
                    triggered = true;
                    done();
                });
                p.reject('error');

                assert.ok(triggered);
            });

            it('does not trigger onRejected listeners if already fulfilled', function () {
                var triggered = false;

                p = Promise.of(1);
                p.onRejected(function () {
                    triggered = true;
                });
                p.reject('error');

                assert.ok(!triggered);
            });
        });

        describe('#onRejected', function () {
            it('binds a listener to be fired on rejection', function (done) {
                p = new Promise();
                p.reject('error');

                p.onRejected(function (reason) {
                    assert.equal('error', reason);
                    done();
                });
            });
        });

        describe('#map', function () {
            it('yields the value of the promise', function (done) {
                p.map(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('yields the value after resolution', function (done) {
                p.map(function () {
                    /* Promise is now resolved so map again... */
                    p.map(function (x) {
                        assert.equal('foo', x);
                        done();
                    });
                });
            });

            it('can be chained', function (done) {
                p.map(function (x) {
                    return x + '!';
                }).map(function (y) {
                    assert.equal('foo!', y);
                    done();
                });
            });

            it('can be nested', function (done) {
                p.map(function (x) {
                    p2.map(function (y) {
                        p3.map(function (z) {
                            assert.equal('foo', x);
                            assert.equal('bar', y);
                            assert.equal('baz', z);
                            done();
                        });
                    });
                });
            });

            it('fulfils the identity property of a functor', function (done) {
                p.map(function (x) {
                    return x;
                }).map(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('fulfils the composition property of a functor #1', function (done) {
                var f = function (x) { return 'f(' + x + ')'; },
                    g = function (x) { return 'g(' + x + ')'; };

                p.map(function (x) { return f(g(x)); }).map(function (x) {
                    assert.equal('f(g(foo))', x);
                    done();
                });
            });

            it('fulfils the composition property of a functor #2', function (done) {
                var f = function (x) { return 'f(' + x + ')'; },
                    g = function (x) { return 'g(' + x + ')'; };

                p.map(g).map(f).map(function (x) {
                    assert.equal('f(g(foo))', x);
                    done();
                });
            });
        });

        describe('#then', function () {
            it('yields its value like #map', function (done) {
                p.then(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('can be chained when returning a value', function (done) {
                p.then(function (x) {
                    return x + '!';
                }).then(function (x) {
                    assert.equal('foo!', x);
                    done();
                });
            });

            it('does not wrap a promise in a promise', function (done) {
                p.then(function (x) {
                    return Promise.of(x);
                }).map(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('always returns a promise', function () {
                assert.equal('object', typeof p.then());
            });

            it('returns a fulfilled promise with the return value of onRejected', function (done) {
                p = new Promise();
                p.reject('foo');

                p2 = p.then(function () {
                    return 1;
                }, function () {
                    return 'error';
                });

                p2.map(function (x) {
                    assert.equal('error', x);
                    assert.equal('fulfilled', p2.state());
                    done();
                });
            });

            it('assumes the return value of onFulfilled', function (done) {
                p = Promise.of('foo');
                p2 = p.then(function () {
                    return 1;
                }, function () {
                    return 'error';
                });

                p2.map(function (x) {
                    assert.equal(1, x);
                    assert.equal('fulfilled', p2.state());
                    done();
                });
            });
        });

        describe('#concat', function () {
            it('fulfils the associativity property of semigroups #1', function (done) {
                p = Promise.of([1]);
                p2 = Promise.of([2]);
                p3 = Promise.of([3]);

                p.concat(p2).concat(p3).map(function (x) {
                    assert.equal(1, x[0]);
                    assert.equal(2, x[1]);
                    assert.equal(3, x[2]);
                    done();
                });
            });

            it('fulfils the associativity property of semigroups #2', function (done) {
                p = Promise.of([1]);
                p2 = Promise.of([2]);
                p3 = Promise.of([3]);

                p.concat(p2.concat(p3)).map(function (x) {
                    assert.equal(1, x[0]);
                    assert.equal(2, x[1]);
                    assert.equal(3, x[2]);
                    done();
                });
            });

            it('fulfils the identity of a semigroup', function (done) {
                p = Promise.of([1]);
                p2 = Promise.of([2]);
                p3 = Promise.of([3]);

                p.concat(p2).concat(p3).map(function (x) {
                    return x;
                }).map(function (x) {
                    assert.deepEqual([1, 2, 3], x);
                    done();
                });
            });

            it('concatenates any monoid including strings', function (done) {
                p.concat(p2).concat(p3).map(function (x) {
                    assert.equal('foobarbaz', x);
                    done();
                });
            });

            it('is rejected if the first promise is rejected', function (done) {
                p.reject('Foo');
                p.concat(p2).onRejected(function (reason) {
                    assert.equal('Foo', reason);
                    done();
                });
            });

            it('is rejected if the second promise is rejected', function (done) {
                p2.reject('Foo');
                p.concat(p2).onRejected(function (reason) {
                    assert.equal('Foo', reason);
                    done();
                });
            });

            it('takes the first rejection if both promises are rejected', function (done) {
                p.reject('Foo');
                p2.reject('Bar');
                p.concat(p2).onRejected(function (reason) {
                    assert.equal('Foo', reason);
                    done();
                });
            });
        });

        describe('#chain', function () {
            it('fulfils the associativity property of chain #1', function (done) {
                var f = function (x) { return Promise.of('f(' + x + ')'); },
                    g = function (x) { return Promise.of('g(' + x + ')'); };

                p.chain(f).chain(g).map(function (x) {
                    assert.equal('g(f(foo))', x);
                    done();
                });
            });

            it('fulfils the associativity property of chain #2', function (done) {
                var f = function (x) { return Promise.of('f(' + x + ')'); },
                    g = function (x) { return Promise.of('g(' + x + ')'); };

                p.chain(function (x) { return f(x).chain(g); }).map(function (x) {
                    assert.equal('g(f(foo))', x);
                    done();
                });
            });
        });

        describe('#ap', function () {
            it('fulfils the identity property of applicative', function (done) {
                Promise.of(function (a) { return a; }).ap(p).map(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('fulfils the composition property of applicative #1', function (done) {
                var u = Promise.of(function (x) { return 'u(' + x + ')'; }),
                    v = Promise.of(function (x) { return 'v(' + x + ')'; }),
                    w = Promise.of('foo');

                Promise.of(function (f) {
                    return function (g) {
                        return function (x) {
                            return f(g(x));
                        };
                    };
                }).ap(u).ap(v).ap(w).map(function (x) {
                    assert.equal('u(v(foo))', x);
                    done();
                });
            });

            it('fulfils the composition property of applicative #2', function (done) {
                var u = Promise.of(function (x) { return 'u(' + x + ')'; }),
                    v = Promise.of(function (x) { return 'v(' + x + ')'; }),
                    w = Promise.of('foo');

                u.ap(v.ap(w)).map(function (x) {
                    assert.equal('u(v(foo))', x);
                    done();
                });
            });

            it('fulfils the homomorphism property of applicative #1', function (done) {
                var f = function (x) { return 'f(' + x + ')'; };

                Promise.of(f).ap(Promise.of('foo')).map(function (x) {
                    assert.equal('f(foo)', x);
                    done();
                });
            });

            it('fulfils the homomorphism property of applicative #2', function (done) {
                var f = function (x) { return 'f(' + x + ')'; };

                Promise.of(f('foo')).map(function (x) {
                    assert.equal('f(foo)', x);
                    done();
                });
            });

            it('fulfils the interchange property of applicative #1', function (done) {
                var u = Promise.of(function (x) { return 'u(' + x + ')'; }),
                    y = 'y';

                u.ap(Promise.of(y)).map(function (x) {
                    assert.equal('u(y)', x);
                    done();
                });
            });

            it('fulfils the interchange property of applicative #2', function (done) {
                var u = Promise.of(function (x) { return 'u(' + x + ')'; }),
                    y = 'y';

                Promise.of(function (f) {
                    return f(y);
                }).ap(u).map(function (x) {
                    assert.equal('u(y)', x);
                    done();
                });
            });
        });

        describe('#empty', function () {
            it('conforms to the right identity', function (done) {
                p = Promise.of([1]);

                p.concat(p.empty()).map(function (x) {
                    assert.deepEqual([1], x);
                    done();
                });
            });

            it('conforms to the left identity', function (done) {
                p = Promise.of([1]);

                p.empty().concat(p).map(function (x) {
                    assert.deepEqual([1], x);
                    done();
                });
            });
        });

        describe('#conjoin', function () {
            it('concatenates values into a list regardless of type', function (done) {
                p.conjoin(p2).conjoin(p3).map(function (x) {
                    assert.deepEqual(['foo', 'bar', 'baz'], x);
                    done();
                });
            });

            it('concatenates values into a list even if already a list', function (done) {
                p = Promise.of([1]);
                p2 = Promise.of([2, 3]);
                p3 = Promise.of([4]);

                p.conjoin(p2).conjoin(p3).map(function (x) {
                    assert.deepEqual([1, 2, 3, 4], x);
                    done();
                });
            });

            it('concatenates values of mixed types', function (done) {
                p2 = Promise.of([2, 3]);

                p.conjoin(p2).map(function (x) {
                    assert.deepEqual(['foo', 2, 3], x);
                    done();
                });
            });
        });

        describe('#append', function () {
            it('appends promises to a promise of an array', function (done) {
                p = Promise.of([1]);
                p2 = Promise.of(2);

                p.append(p2).map(function (x) {
                    assert.deepEqual([1, 2], x);
                    done();
                });
            });

            it('appends promises of arrays to arrays without joining them', function (done) {
                p = Promise.of([1]);
                p2 = Promise.of([2]);

                p.append(p2).map(function (x) {
                    assert.deepEqual([1, [2]], x);
                    done();
                });
            });

            it('can be chained without nesting arrays', function (done) {
                p = Promise.of([]);
                p2 = Promise.of([1]);
                p3 = Promise.of([2, 3]);
                p4 = Promise.of([4]);

                p.append(p2).append(p3).append(p4).map(function (x) {
                    assert.deepEqual([[1], [2, 3], [4]], x);
                    done();
                });
            });
        });

        describe('#spread', function () {
            it('calls the given function with each value of the Promise', function (done) {
                p = Promise.of([1, 2, 3]);

                p.spread(function (x, y, z) {
                    assert.equal(1, x);
                    assert.equal(2, y);
                    assert.equal(3, z);
                    done();
                });
            });

            it('returns a promise with a single value', function (done) {
                p = Promise.of([1, 2, 3]);

                p.spread(function (x, y, z) {
                    return x + y + z;
                }).map(function (x) {
                    assert.equal(6, x);
                    done();
                });
            });
        });

        describe('#reduce', function () {
            it('returns a new promise with the result', function (done) {
                p = Promise.of([[1], [2], [3]]);

                p.reduce(function (acc, e) {
                    return acc.concat(e);
                }).map(function (x) {
                    assert.deepEqual([1, 2, 3], x);
                    done();
                });
            });

            it('takes an optional initial value', function (done) {
                p = Promise.of([1, 2, 3]);

                p.reduce(function (acc, e) {
                    return acc + e;
                }, 0).map(function (x) {
                    assert.equal(6, x);
                    done();
                });
            });
        });
    });

    describe('Array', function () {
        describe('.empty', function () {
            assert.deepEqual([], Array.empty());
        });
    });

    describe('String', function () {
        describe('.empty', function () {
            assert.equal('', String.empty());
        });
    });
}));
