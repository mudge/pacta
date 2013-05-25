# pacta [![Build Status](https://travis-ci.org/mudge/pacta.png?branch=master)](https://travis-ci.org/mudge/pacta)

This is an implementation of algebraic Promises in
[node.js](http://nodejs.org) (having been convinced by [James
Coglan](http://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/)
and [Aanand Prasad](http://aanandprasad.com/articles/negronis/)).

Promises can be thought of as objects representing a value that may not have
been calculated yet (similar to the [Maybe
monad](https://en.wikipedia.org/wiki/Monad_(functional_programming)#The_Maybe_monad)).
An obvious example is that of the result of an asynchronous HTTP request: it's
not clear *when* the request will be fulfilled but it will be at some point in
the future. Having an actual Promise object representing this eventual values
allows you to compose, transform and act on them without worrying about their
time of execution.

For a worked example of this, see the
[two](https://github.com/mudge/pacta/blob/master/example/codenames.js)
[examples](https://github.com/mudge/pacta/blob/master/example/codenames-2.js)
and [sample HTTP
client](https://github.com/mudge/pacta/blob/master/example/promised-http.js)
included in Pacta.

Pacta's promises can be used as the following algebraic structures as defined
in the [Fantasty Land
Specification](https://github.com/puffnfresh/fantasy-land):

* [Semigroups](https://github.com/puffnfresh/fantasy-land#semigroup) (through
  `Promise#concat` which concatenates promises containing semigroups such as
  arrays and strings);
* [Monoids](https://github.com/puffnfresh/fantasy-land#monoid) (through
  `Promise#empty` which returns an empty version of a promise that contains a
  monoid);
* [Functors](https://github.com/puffnfresh/fantasy-land#functor) (through
  `Promise#map`);
* [Applicative](https://github.com/puffnfresh/fantasy-land#applicative)
  (through `Promise#ap` and `Promise.of`);
* [Chains](https://github.com/puffnfresh/fantasy-land#chain) (through `Promise#chain`);
* [Monads](https://github.com/puffnfresh/fantasy-land#monad) (through all of
  the above).

Above that, Pacta also provides the following functions for creating and
working with Promises of lists:

* `conjoin` to concatenate promises into a list of values regardless of their
  original type meaning that non-Monoid types can be combined with others
  (e.g. a promise of `'foo'` can be conjoined with `[1, 2]` to produce
  `['foo', 1, 2]`);
* `append` to append promises to an initial promise of a list. This means that
  you can work more easily with multiple promises of lists without joining
  them together (as would be done with `concat` and `conjoin`), e.g. appending
  a promise of `[2, 3]` to a promise of `[1]` results in `[1, [2, 3]]` rather
  than `[1, 2, 3]`);
* `spread` to map over a promise's value but, instead of receiving a single
  value, spread the promise's value across separate arguments:

```javascript
Promise.of([1, 2]).spread(function (x, y) {
  console.log(x); //=> 1
  console.log(y); //=> 2
});
```

It also defines a monoid interface for `Array` and `String`, implementing
`empty` such that:

```javascript
Array.empty();  //=> []
String.empty(); //=> ""
```

Note that Pacta does not handle errors or the concept of a failed promise as
yet.

See [the test
suite](https://github.com/mudge/pacta/blob/master/test/pacta_test.js) for more
information.

## Usage

```javascript
var Promise = require('pacta').Promise;

var p = new Promise();
setTimeout(function () {
  p.resolve('Foo');
}, 1000);

p.map(console.log); //=> "Foo"

p.map(function (x) {
  return x + '!';
}).map(console.log); //=> "Foo!"

var p2 = new Promise();
setTimeout(function () {
  p2.resolve(['bar']);
}, 500);

var p3 = Promise.of(['baz']);

p2.concat(p3).map(function (x) {
  console.log(x); //=> [ 'bar', 'baz' ]
});

p.conjoin(p2).map(function (x) {
  console.log(x); //=> [ 'Foo', 'bar' ]
});

Promise.of([]).append(p).append(p2).map(function (x) {
  console.log(x); //=> [ 'Foo', [ 'bar' ] ]
});

p2.append(p).explode(function (x, y) {
  console.log(x); //=> 'bar'
  console.log(y); //=> 'Foo'
});
```
