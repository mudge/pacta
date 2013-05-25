# pacta [![Build Status](https://travis-ci.org/mudge/pacta.png?branch=master)](https://travis-ci.org/mudge/pacta)

This is an implementation of algebraic Promises in
[node.js](http://nodejs.org).

Promises can be thought of as objects representing a value that may not have
been calculated yet (similar to the [Maybe monad][Maybe]). An obvious example
is the result of an asynchronous HTTP request: it's not clear *when*
the request will be fulfilled but it will be at some point in the future.
Having actual Promise objects representing these eventual values allows you
to compose, transform and act on them without worrying about their time or
sequence of execution.

For a worked example of this, see the
[two](https://github.com/mudge/pacta/blob/master/example/codenames.js)
[example programs](https://github.com/mudge/pacta/blob/master/example/codenames-2.js)
and [sample HTTP
client](https://github.com/mudge/pacta/blob/master/example/promised-http.js)
included in Pacta.

Pacta's promises can be used as the following algebraic structures as defined
in the [Fantasy Land
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

* `Promise#conjoin` to concatenate promises into a list of values regardless
  of their original type meaning that non-Monoid types can be combined with
  others (e.g. a promise of `'foo'` can be conjoined with `[1, 2]` to produce
  `['foo', 1, 2]`);
* `Promise#append` to append promises to an initial promise of a list. This
  means that you can work more easily with multiple promises of lists without
  joining them together (as would be done with `concat` and `conjoin`), e.g.
  appending a promise of `[2, 3]` to a promise of `[1]` results in `[1, [2,
  3]]` rather than `[1, 2, 3]`);
* `Promise#spread` to map over a promise's value but, instead of receiving a
  single value, spread the promise's value across separate arguments:

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

[Maybe]: https://en.wikipedia.org/wiki/Monad_(functional_programming)#The_Maybe_monad

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

## API

### Promise

```javascript
var promise = new Promise();
```

Create a new, unfulfilled promise that will eventually be populated with a
value (through `resolve`).

### Promise.of

```javascript
var promise = Promise.of(1);
var promise = Promise.of('foo');
```

Create a new, fulfilled promise already populated with a value.

### Promise#resolve

```javascript
var promise = new Promise();
promise.resolve(5);
```

Populate a promise with its final value thereby resolving it.

### Promise#map

```javascript
var promise = Promise.of(2);

promise.map(function (x) {
  console.log(x);

  return x * 2;
}); //=> Promise.of(4)
```

Execute a function on the contents of the promise. This returns a new promise
of the result of the given function being executed.

Note that this is the primary way of acting on the value of a promise: you can
use side-effects within your given function (e.g. `console.log`) as well as
modifying the value and returning it.

### Promise#concat

```javascript
var promise = Promise.of('foo'),
    promise2 = Promise.of('bar');

promise.concat(promise2); //=> Promise.of('foobar')
```

Concatenate two promises into a single promise of both values concatenated
together. This will work for any promise containing a semigroup (viz. a value
that supports `concat`) such as `String` or `Array`. Note that [`concat`'s
usual
behaviour](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/concat)
of joining arrays, etc. applies.

See also `Promise#conjoin` and `Promise#append`.

### Promise#chain

```javascript
var promise = Promise.of(2);

promise.chain(function (x) { return Promise.of(x * 2); }); //=> Promise.of(4)
```

Execute a given function that returns a new promise against a promise. This
differs from `Promise#map` in that the function *must* return a promise
itself.

### Promise#ap

```javascript
var promise = Promise.of(function (x) { return x * 2; }),
    promise2 = Promise.of(2);

promise.ap(promise2); //=> Promise.of(4)
```

On a promise containing a function, call that function with a promise
containing a value.

### Promise#empty

```javascript
var promise = Promise.of('woo');

promise.empty(); //=> Promise.of('')
```

On a promise containing a monoid (viz. something with an `empty()` function on
itself or its constructor like `Array` or `String`), return a new promise with
an empty version of the initial value.

### Promise#conjoin

```javascript
var promise = Promise.of(1),
    promise2 = Promise.of([2, 3]);

promise.conjoin(promise2); //=> Promise.of([1, 2, 3])
```

Conjoin two promises together, converting their values to arrays if needed
(e.g. `'foo'` into `['foo']`).

### Promise#append

```javascript
var promise = Promise.of([]),
    promise2 = Promise.of([1]);

promise.append(promise2); //=> Promise.of([[1]])
```

On a promise of a list, append another promise's value to it without joining
(e.g. appending `[1]` to `[]` results in `[[1]]` rather than `[1]` as it would
with `concat` and `conjoin`).

### Promise#spread

```javascript
var promise = Promise.of([1, 2]);

promise.spread(function (x, y) {
  return x + y;
}); //=> Promise.of(3)
```

Similar to `map`, apply a given function to a promise of a list but, instead
of receiving a single argument, pass each value of the list to the function
separately.

## Acknowledgements

[James
Coglan](http://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/)
and [Aanand Prasad](http://aanandprasad.com/articles/negronis/) convinced me
to explore the idea of monadic promises and [Brian McKenna's "Fantasy Land"
specification](https://github.com/puffnfresh/fantasy-land) and
[feedback](https://github.com/mudge/pacta/issues/1) were essential.

## License

Copyright © 2013 Paul Mucur.

Distributed under the MIT License.

