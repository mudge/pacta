# pacta [![Build Status](https://travis-ci.org/mudge/pacta.png?branch=master)](https://travis-ci.org/mudge/pacta)

This is an implementation of algebraic Promises in
[node.js](http://nodejs.org) having been convinced by [James
Coglan](http://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/)
and [Aanand Prasad](http://aanandprasad.com/articles/negronis/).

Pacta's promises can be used as the following algebraic structures:

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

Above that, Pacta also provides:

* `conjoin` to concatenate promises into a list of values regardless of their
  original type meaning that non-Monoid types can be combined with others
  (e.g. a promise of `'foo'` can be conjoined with `[1, 2]` to produce
  `['foo', 1, 2]`);
* `combine` to conjoin promises without flattening lists (e.g. combining a
  promise of `[1, 2]` and `[3]` will give a promise of `[[1, 2], [3]]` instead
  of `[1, 2, 3]` as it would with `concat` and `conjoin`);
* `explode` to map over a promise's value but, instead of receiving a single
  value, explode the promise's value into seperate arguments:

```javascript
Promise.of([1, 2]).explode(function (x, y) {
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

See the [HTTP client
example](https://github.com/mudge/pacta/blob/master/example/codenames.js) and
[the test
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

p.combine(p2).map(function (x) {
  console.log(x); //=> [ 'Foo', [ 'bar' ] ]
});

p.combine(p2).explode(function (x, y) {
  console.log(x); //=> Foo
  console.log(y); //=> [ 'bar' ]
});
```
