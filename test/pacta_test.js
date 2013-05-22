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

    describe('#juxt', function () {
        it('returns a new promise composed of the two', function (done) {
            p.juxt(p2).juxt(p3).juxt(p4).map(function (x, y, z, a) {
                assert.equal('foo', x);
                assert.equal('bar', y);
                assert.equal('baz', z);
                assert.equal('quux', a);
                done();
            });
        });
    });
});
