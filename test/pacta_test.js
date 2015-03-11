/*global describe, it, beforeEach, require, setTimeout */
(function (context, test) {
    'use strict';

    if (typeof context.assert === 'object' && typeof context.Promise === 'function') {
        test(context.assert, context.Promise);
    } else {
        test(require('assert'), require('../lib/pacta'));
    }
}(this, function (assert, Promise) {
    'use strict';

    describe('Promise', function () {
        function emptyPromise() {
            return new Promise();
        }

        function rejectedPromise(reason) {
            var p = new Promise();

            if (reason === undefined) {
                reason = 'error';
            }

            p.reject(reason);

            return p;
        }

        function fulfilledPromise(value) {
            if (value === undefined) {
                value = 1;
            }

            return Promise.of(value);
        }

        describe('.of', function () {
            it('wraps a value in a new promise', function (done) {
                fulfilledPromise(1).map(function (x) {
                    assert.equal(1, x);
                    done();
                });
            });
        });

        describe('#state', function () {
            it('is pending for unfulfilled and unrejected promises', function () {
                assert.equal('pending', emptyPromise().state());
            });

            it('is fulfilled for fulfilled promises', function () {
                assert.equal('fulfilled', fulfilledPromise().state());
            });

            it('is rejected for rejected promises', function () {
                assert.equal('rejected', rejectedPromise().state());
            });
        });

        describe('#resolve', function () {
            it('resolves a promise with its final value', function () {
                var p = emptyPromise();
                p.resolve(1);

                assert.equal('fulfilled', p.state());
            });

            it('triggers any listeners for resolution', function (done) {
                var triggered = false,
                    p = emptyPromise();

                p.map(function () {
                    triggered = true;
                });

                p.resolve(1);

                /* Wait for a new execution context stack. */
                setTimeout(function () {
                    assert.ok(triggered);
                    done();
                }, 50);
            });

            it('does nothing to rejected promises', function () {
                var p = rejectedPromise();
                p.resolve(1);

                assert.equal('rejected', p.state());
            });

            it('does not trigger listeners if the promise is rejected', function () {
                var triggered = false,
                    p = rejectedPromise();

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
                var p = emptyPromise();
                p.reject('error');

                assert.equal('rejected', p.state());
            });

            it('does nothing to fulfilled promises', function () {
                var p = fulfilledPromise();
                p.reject('error');

                assert.equal('fulfilled', p.state());
            });

            it('triggers onRejected listeners', function (done) {
                var triggered = false,
                    p = emptyPromise();

                p.onRejected(function () {
                    triggered = true;
                });
                p.reject('error');

                /* Wait for a new execution context stack. */
                setTimeout(function () {
                    assert.ok(triggered);
                    done();
                }, 50);
            });

            it('does not trigger onRejected listeners if already fulfilled', function () {
                var triggered = false,
                    p = fulfilledPromise();

                p.onRejected(function () {
                    triggered = true;
                });
                p.reject('error');

                assert.ok(!triggered);
            });
        });

        describe('#onRejected', function () {
            it('binds a listener to be fired on rejection', function (done) {
                var p = rejectedPromise('error');

                p.onRejected(function (reason) {
                    assert.equal('error', reason);
                    done();
                });
            });

            it('can be used to recover from a rejection', function (done) {
                var p1 = rejectedPromise(new TypeError()),
                    p2 = p1.onRejected(function () {
                        assert.equal('rejected', p1.state());
                        return 'Some safe default';
                    });

                p2.map(function (x) {
                    assert.equal('fulfilled', p2.state());
                    assert.equal('Some safe default', x);
                    done();
                });
            });

            it('can chain failures', function (done) {
                var p1 = rejectedPromise(new TypeError()),
                    p2 = p1.onRejected(function () {
                        assert.equal('rejected', p1.state());
                        throw new TypeError();
                    });

                p2.onRejected(function () {
                    assert.equal('rejected', p2.state());
                    done();
                });
            });
        });

        describe('#map', function () {
            it('yields the value of the promise', function (done) {
                fulfilledPromise('foo').map(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('yields the value after resolution', function (done) {
                var p = emptyPromise();
                setTimeout(function () { p.resolve('foo'); }, 50);

                p.map(function () {
                    /* Promise is now resolved so map again... */
                    p.map(function (x) {
                        assert.equal('foo', x);
                        done();
                    });
                });
            });

            it('can be chained', function (done) {
                var p = fulfilledPromise('foo');

                p.map(function (x) {
                    return x + '!';
                }).map(function (y) {
                    assert.equal('foo!', y);
                    done();
                });
            });

            it('can be nested', function (done) {
                var p1 = fulfilledPromise('foo'),
                    p2 = fulfilledPromise('bar'),
                    p3 = fulfilledPromise('baz');

                p1.map(function (x) {
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

            it('encapsulates exceptions in rejections', function (done) {
                var exception = new TypeError(),
                    p = fulfilledPromise('foo').map(function () {
                        throw exception;
                    });

                p.onRejected(function (r) {
                    assert.equal('rejected', p.state());
                    assert.equal(exception, r);
                    done();
                });
            });

            it('fulfils the identity property of a functor', function (done) {
                fulfilledPromise('foo').map(function (x) {
                    return x;
                }).map(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('fulfils the composition property of a functor #1', function (done) {
                var f = function (x) { return 'f(' + x + ')'; },
                    g = function (x) { return 'g(' + x + ')'; };

                fulfilledPromise('foo').map(function (x) { return f(g(x)); }).map(function (x) {
                    assert.equal('f(g(foo))', x);
                    done();
                });
            });

            it('fulfils the composition property of a functor #2', function (done) {
                var f = function (x) { return 'f(' + x + ')'; },
                    g = function (x) { return 'g(' + x + ')'; };

                fulfilledPromise('foo').map(g).map(f).map(function (x) {
                    assert.equal('f(g(foo))', x);
                    done();
                });
            });
        });

        describe('#mapError', function () {
            it('yields the reason of the promise', function (done) {
                rejectedPromise('foo').mapError(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('yields the reason after rejection', function (done) {
                var p = emptyPromise();
                setTimeout(function () { p.reject('foo'); }, 50);

                p.mapError(function () {
                    /* Promise is now rejected so mapError again... */
                    p.mapError(function (x) {
                        assert.equal('foo', x);
                        done();
                    });
                });
            });

            it('can be chained', function (done) {
                rejectedPromise('foo').mapError(function (x) {
                    return x + '!';
                }).mapError(function (y) {
                    assert.equal('foo!', y);
                    done();
                });
            });

            it('can be nested', function (done) {
                var p1 = rejectedPromise('foo'),
                    p2 = rejectedPromise('bar'),
                    p3 = rejectedPromise('baz');

                p1.mapError(function (x) {
                    p2.mapError(function (y) {
                        p3.mapError(function (z) {
                            assert.equal('foo', x);
                            assert.equal('bar', y);
                            assert.equal('baz', z);
                            done();
                        });
                    });
                });
            });

            it('encapsulates exceptions in rejections', function (done) {
                var exception = new TypeError(),
                    p1 = emptyPromise(),
                    p2;

                p1.reject('foo');

                p2 = p1.mapError(function () {
                    throw exception;
                });

                p2.onRejected(function (r) {
                    assert.equal('rejected', p2.state());
                    assert.equal(exception, r);
                    done();
                });
            });

            it('fulfils the identity property of a functor', function (done) {
                rejectedPromise('foo').mapError(function (x) {
                    return x;
                }).mapError(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('fulfils the composition property of a functor #1', function (done) {
                var f = function (x) { return 'f(' + x + ')'; },
                    g = function (x) { return 'g(' + x + ')'; };

                rejectedPromise('foo').mapError(function (x) { return f(g(x)); }).mapError(function (x) {
                    assert.equal('f(g(foo))', x);
                    done();
                });
            });

            it('fulfils the composition property of a functor #2', function (done) {
                var f = function (x) { return 'f(' + x + ')'; },
                    g = function (x) { return 'g(' + x + ')'; };

                rejectedPromise('foo').mapError(g).mapError(f).mapError(function (x) {
                    assert.equal('f(g(foo))', x);
                    done();
                });
            });
        });

        describe('#then', function () {
            it('yields its value like #map', function (done) {
                fulfilledPromise('foo').then(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('can be chained when returning a value', function (done) {
                fulfilledPromise('foo').then(function (x) {
                    return x + '!';
                }).then(function (x) {
                    assert.equal('foo!', x);
                    done();
                });
            });

            it('does not wrap a promise in a promise', function (done) {
                fulfilledPromise('foo').then(function (x) {
                    return fulfilledPromise(x);
                }).map(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('always returns a promise', function () {
                assert.equal(Promise, fulfilledPromise('foo').then().constructor);
            });

            it('returns a fulfilled promise with the return value of onRejected', function (done) {
                var p1 = rejectedPromise('foo'),
                    p2 = p1.then(function () {
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
                var p1 = fulfilledPromise('foo'),
                    p2 = p1.then(function () {
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
                var p1 = fulfilledPromise([1]),
                    p2 = fulfilledPromise([2]),
                    p3 = fulfilledPromise([3]);

                p1.concat(p2).concat(p3).map(function (x) {
                    assert.equal(1, x[0]);
                    assert.equal(2, x[1]);
                    assert.equal(3, x[2]);
                    done();
                });
            });

            it('fulfils the associativity property of semigroups #2', function (done) {
                var p1 = fulfilledPromise([1]),
                    p2 = fulfilledPromise([2]),
                    p3 = fulfilledPromise([3]);

                p1.concat(p2.concat(p3)).map(function (x) {
                    assert.equal(1, x[0]);
                    assert.equal(2, x[1]);
                    assert.equal(3, x[2]);
                    done();
                });
            });

            it('fulfils the identity of a semigroup', function (done) {
                var p1 = fulfilledPromise([1]),
                    p2 = fulfilledPromise([2]),
                    p3 = fulfilledPromise([3]);

                p1.concat(p2).concat(p3).map(function (x) {
                    return x;
                }).map(function (x) {
                    assert.deepEqual([1, 2, 3], x);
                    done();
                });
            });

            it('concatenates any monoid including strings', function (done) {
                var p1 = fulfilledPromise('foo'),
                    p2 = fulfilledPromise('bar'),
                    p3 = fulfilledPromise('baz');

                p1.concat(p2).concat(p3).map(function (x) {
                    assert.equal('foobarbaz', x);
                    done();
                });
            });

            it('is rejected if the first promise is rejected', function (done) {
                var p1 = rejectedPromise('Foo'),
                    p2 = fulfilledPromise('bar');

                p1.concat(p2).onRejected(function (reason) {
                    assert.equal('Foo', reason);
                    done();
                });
            });

            it('is rejected if the second promise is rejected', function (done) {
                var p1 = fulfilledPromise('foo'),
                    p2 = rejectedPromise('Foo');

                p1.concat(p2).onRejected(function (reason) {
                    assert.equal('Foo', reason);
                    done();
                });
            });

            it('takes the first rejection if both promises are rejected', function (done) {
                var p1 = rejectedPromise('Foo'),
                    p2 = rejectedPromise('Bar');

                p1.concat(p2).onRejected(function (reason) {
                    assert.equal('Foo', reason);
                    done();
                });
            });
        });

        describe('#chain', function () {
            it('fulfils the associativity property of chain #1', function (done) {
                var f = function (x) { return fulfilledPromise('f(' + x + ')'); },
                    g = function (x) { return fulfilledPromise('g(' + x + ')'); };

                fulfilledPromise('foo').chain(f).chain(g).map(function (x) {
                    assert.equal('g(f(foo))', x);
                    done();
                });
            });

            it('fulfils the associativity property of chain #2', function (done) {
                var f = function (x) { return fulfilledPromise('f(' + x + ')'); },
                    g = function (x) { return fulfilledPromise('g(' + x + ')'); };

                fulfilledPromise('foo').chain(function (x) { return f(x).chain(g); }).map(function (x) {
                    assert.equal('g(f(foo))', x);
                    done();
                });
            });

            it('encapsulates exceptions in rejections', function (done) {
                var exception = new TypeError(),
                    p = fulfilledPromise().chain(function () { throw exception; });

                p.onRejected(function (r) {
                    assert.equal('rejected', p.state());
                    assert.equal(exception, r);
                    done();
                });
            });

            it('rejects the returned promise, if f does not return a promise', function (done) {
                var p = fulfilledPromise().chain(function () { return 'not-a-promise'; });

                p.onRejected(function (r) {
                    assert.equal('rejected', p.state());
                    assert.equal(TypeError, r.constructor);
                    done();
                });
            });
        });

        describe('#chainError', function () {
            it('fulfils the associativity property of chain #1', function (done) {
                var f = function (x) { return rejectedPromise('f(' + x + ')'); },
                    g = function (x) { return rejectedPromise('g(' + x + ')'); };

                rejectedPromise('foo').chainError(f).chainError(g).mapError(function (x) {
                    assert.equal('g(f(foo))', x);
                    done();
                });
            });

            it('fulfils the associativity property of chain #2', function (done) {
                var f = function (x) { return rejectedPromise('f(' + x + ')'); },
                    g = function (x) { return rejectedPromise('g(' + x + ')'); };

                rejectedPromise('foo').chainError(function (x) { return f(x).chainError(g); }).mapError(function (x) {
                    assert.equal('g(f(foo))', x);
                    done();
                });
            });

            it('encapsulates exceptions in rejections', function (done) {
                var exception = new TypeError(),
                    p = rejectedPromise().chainError(function () { throw exception; });

                p.onRejected(function (r) {
                    assert.equal('rejected', p.state());
                    assert.equal(exception, r);
                    done();
                });
            });

            it('rejects the returned promise, if f does not return a promise', function (done) {
                var p = rejectedPromise().chainError(function () { return 'not-a-promise'; });

                p.onRejected(function (r) {
                    assert.equal('rejected', p.state());
                    assert.equal(TypeError, r.constructor);
                    done();
                });
            });
        });

        describe('#ap', function () {
            it('fulfils the identity property of applicative', function (done) {
                fulfilledPromise(function (a) { return a; }).ap(fulfilledPromise('foo')).map(function (x) {
                    assert.equal('foo', x);
                    done();
                });
            });

            it('fulfils the composition property of applicative #1', function (done) {
                var u = fulfilledPromise(function (x) { return 'u(' + x + ')'; }),
                    v = fulfilledPromise(function (x) { return 'v(' + x + ')'; }),
                    w = fulfilledPromise('foo');

                fulfilledPromise(function (f) {
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
                var u = fulfilledPromise(function (x) { return 'u(' + x + ')'; }),
                    v = fulfilledPromise(function (x) { return 'v(' + x + ')'; }),
                    w = fulfilledPromise('foo');

                u.ap(v.ap(w)).map(function (x) {
                    assert.equal('u(v(foo))', x);
                    done();
                });
            });

            it('fulfils the homomorphism property of applicative #1', function (done) {
                var f = function (x) { return 'f(' + x + ')'; };

                fulfilledPromise(f).ap(fulfilledPromise('foo')).map(function (x) {
                    assert.equal('f(foo)', x);
                    done();
                });
            });

            it('fulfils the homomorphism property of applicative #2', function (done) {
                var f = function (x) { return 'f(' + x + ')'; };

                fulfilledPromise(f('foo')).map(function (x) {
                    assert.equal('f(foo)', x);
                    done();
                });
            });

            it('fulfils the interchange property of applicative #1', function (done) {
                var u = fulfilledPromise(function (x) { return 'u(' + x + ')'; }),
                    y = 'y';

                u.ap(fulfilledPromise(y)).map(function (x) {
                    assert.equal('u(y)', x);
                    done();
                });
            });

            it('fulfils the interchange property of applicative #2', function (done) {
                var u = fulfilledPromise(function (x) { return 'u(' + x + ')'; }),
                    y = 'y';

                fulfilledPromise(function (f) {
                    return f(y);
                }).ap(u).map(function (x) {
                    assert.equal('u(y)', x);
                    done();
                });
            });
        });

        describe('#empty', function () {
            it('conforms to the right identity', function (done) {
                var p = fulfilledPromise([1]);

                p.concat(p.empty()).map(function (x) {
                    assert.deepEqual([1], x);
                    done();
                });
            });

            it('conforms to the left identity', function (done) {
                var p = fulfilledPromise([1]);

                p.empty().concat(p).map(function (x) {
                    assert.deepEqual([1], x);
                    done();
                });
            });

            it('works with unresolved promises', function (done) {
                var p = emptyPromise();

                p.concat(p.empty()).map(function (x) {
                    assert.deepEqual([1], x);
                    done();
                });

                p.resolve([1]);
            });
        });

        describe('#conjoin', function () {
            it('concatenates values into a list regardless of type', function (done) {
                var p1 = fulfilledPromise('foo'),
                    p2 = fulfilledPromise('bar'),
                    p3 = fulfilledPromise('baz');

                p1.conjoin(p2).conjoin(p3).map(function (x) {
                    assert.deepEqual(['foo', 'bar', 'baz'], x);
                    done();
                });
            });

            it('concatenates values into a list even if already a list', function (done) {
                var p1 = fulfilledPromise([1]),
                    p2 = fulfilledPromise([2, 3]),
                    p3 = fulfilledPromise([4]);

                p1.conjoin(p2).conjoin(p3).map(function (x) {
                    assert.deepEqual([1, 2, 3, 4], x);
                    done();
                });
            });

            it('concatenates values of mixed types', function (done) {
                var p1 = fulfilledPromise('foo'),
                    p2 = fulfilledPromise([2, 3]);

                p1.conjoin(p2).map(function (x) {
                    assert.deepEqual(['foo', 2, 3], x);
                    done();
                });
            });
        });

        describe('#append', function () {
            it('appends promises to a promise of an array', function (done) {
                var p1 = fulfilledPromise([1]),
                    p2 = fulfilledPromise(2);

                p1.append(p2).map(function (x) {
                    assert.deepEqual([1, 2], x);
                    done();
                });
            });

            it('appends promises of arrays to arrays without joining them', function (done) {
                var p1 = fulfilledPromise([1]),
                    p2 = fulfilledPromise([2]);

                p1.append(p2).map(function (x) {
                    assert.deepEqual([1, [2]], x);
                    done();
                });
            });

            it('can be chained without nesting arrays', function (done) {
                var p1 = fulfilledPromise([]),
                    p2 = fulfilledPromise([1]),
                    p3 = fulfilledPromise([2, 3]),
                    p4 = fulfilledPromise([4]);

                p1.append(p2).append(p3).append(p4).map(function (x) {
                    assert.deepEqual([[1], [2, 3], [4]], x);
                    done();
                });
            });
        });

        describe('#spread', function () {
            it('calls the given function with each value of the Promise', function (done) {
                fulfilledPromise([1, 2, 3]).spread(function (x, y, z) {
                    assert.equal(1, x);
                    assert.equal(2, y);
                    assert.equal(3, z);
                    done();
                });
            });

            it('returns a promise with a single value', function (done) {
                fulfilledPromise([1, 2, 3]).spread(function (x, y, z) {
                    return x + y + z;
                }).map(function (x) {
                    assert.equal(6, x);
                    done();
                });
            });
        });

        describe('#reduce', function () {
            it('returns a new promise with the result', function (done) {
                fulfilledPromise([[1], [2], [3]]).reduce(function (acc, e) {
                    return acc.concat(e);
                }).map(function (x) {
                    assert.deepEqual([1, 2, 3], x);
                    done();
                });
            });

            it('takes an optional initial value', function (done) {
                fulfilledPromise([1, 2, 3]).reduce(function (acc, e) {
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
