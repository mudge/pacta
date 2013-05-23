var assert = require('assert'),
    Promise = require('../lib/pacta').Promise;

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

        p4 = new Promise('quux');
    });

    describe('.of', function () {
        it('wraps a value in a new promise', function () {
            Promise.of(1).map(function (x) {
                assert.equal(1, x);
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
            p.map(function (x) {
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

        it('fulfils part 1 of https://github.com/puffnfresh/fantasy-land#functor', function (done) {
            p.map(function (x) {
                return x;
            }).map(function (x) {
                assert.equal('foo', x);
                done();
            });
        });

        it('fulfils part 2 of https://github.com/puffnfresh/fantasy-land#functor', function (done) {
            var f = function (x) { return 'f(' + x + ')'; },
                g = function (x) { return 'g(' + x + ')'; };

            p.map(function (x) { return f(g(x)); }).map(function (x) {
                assert.equal('f(g(foo))', x);
                done();
            });
        });

        it('fulfils part 2 of https://github.com/puffnfresh/fantasy-land#functor', function (done) {
            var f = function (x) { return 'f(' + x + ')'; },
                g = function (x) { return 'g(' + x + ')'; };

            p.map(g).map(f).map(function (x) {
                assert.equal('f(g(foo))', x);
                done();
            });
        });
    });

    describe('#concat', function () {
        it('returns a new promise composed of the two', function (done) {
            p.concat(p2).concat(p3).concat(p4).map(function (x, y, z, a) {
                assert.equal('foo', x);
                assert.equal('bar', y);
                assert.equal('baz', z);
                assert.equal('quux', a);
                done();
            });
        });
    });

    describe('#chain', function () {
        it('fulfils https://github.com/puffnfresh/fantasy-land#chain', function (done) {
            var f = function (x) { return Promise.of('f(' + x + ')'); },
                g = function (x) { return Promise.of('g(' + x + ')'); };

            p.chain(f).chain(g).map(function (x) {
                assert.equal('g(f(foo))', x);
                done();
            });
        });

        it('fulfils https://github.com/puffnfresh/fantasy-land#chain', function (done) {
            var f = function (x) { return Promise.of('f(' + x + ')'); },
                g = function (x) { return Promise.of('g(' + x + ')'); };

            p.chain(function (x) { return f(x).chain(g); }).map(function (x) {
                assert.equal('g(f(foo))', x);
                done();
            });
        });
    });

    describe('#ap', function () {
        it('fulfils https://github.com/puffnfresh/fantasy-land#applicative', function (done) {
            Promise.of(function (a) { return a; }).ap(p).map(function (x) {
                assert.equal('foo', x);
                done();
            });
        });

        it('fulfils https://github.com/puffnfresh/fantasy-land#applicative', function (done) {
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

        it('fulfils https://github.com/puffnfresh/fantasy-land#applicative', function (done) {
            var u = Promise.of(function (x) { return 'u(' + x + ')'; }),
                v = Promise.of(function (x) { return 'v(' + x + ')'; }),
                w = Promise.of('foo');

            u.ap(v.ap(w)).map(function (x) {
                assert.equal('u(v(foo))', x);
                done();
            });
        });

        it('fulfils https://github.com/puffnfresh/fantasy-land#applicative', function (done) {
            var f = function (x) { return 'f(' + x + ')'; };

            Promise.of(f).ap(Promise.of('foo')).map(function (x) {
                assert.equal('f(foo)', x);
                done();
            });
        });

        it('fulfils https://github.com/puffnfresh/fantasy-land#applicative', function (done) {
            var f = function (x) { return 'f(' + x + ')'; };

            Promise.of(f('foo')).map(function (x) {
                assert.equal('f(foo)', x);
                done();
            });
        });

        it('fulfils https://github.com/puffnfresh/fantasy-land#applicative', function (done) {
            var u = Promise.of(function (x) { return 'u(' + x + ')'; }),
                y = 'y';

            u.ap(Promise.of(y)).map(function (x) {
                assert.equal('u(y)', x);
                done();
            });
        });

        it('fulfils https://github.com/puffnfresh/fantasy-land#applicative', function (done) {
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
});
