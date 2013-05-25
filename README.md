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
  [`Promise#concat`](#promiseconcatp) which concatenates promises containing semigroups such as
  arrays and strings);
* [Monoids](https://github.com/puffnfresh/fantasy-land#monoid) (through
  [`Promise#empty`](#promiseempty) which returns an empty version of a promise that contains a
  monoid);
* [Functors](https://github.com/puffnfresh/fantasy-land#functor) (through
  [`Promise#map`](#promisemapf));
* [Applicative](https://github.com/puffnfresh/fantasy-land#applicative)
  (through [`Promise#ap`](#promiseapp) and [`Promise.of`](#promiseofx));
* [Chains](https://github.com/puffnfresh/fantasy-land#chain) (through [`Promise#chain`](#promisechainf));
* [Monads](https://github.com/puffnfresh/fantasy-land#monad) (through all of
  the above).

As well as above, Pacta also provides the following functions for creating and
working with Promises of lists:

* [`Promise#conjoin`](#promiseconjoinp) to concatenate promises into a list of
  values regardless of their original type meaning that non-Monoid types can
  be combined with others (e.g. a promise of `'foo'` can be conjoined with
  `[1, 2]` to produce `['foo', 1, 2]`);
* [`Promise#append`](#promiseappendp) to append promises to an initial promise
  of a list. This means that you can work more easily with multiple promises
  of lists without joining them together (as would be done with `concat` and
  `conjoin`), e.g.  appending a promise of `[2, 3]` to a promise of `[1]`
  results in `[1, [2, 3]]` rather than `[1, 2, 3]`);
* [`Promise#spread`](#promisespreadf) to map over a promise's value but,
  instead of receiving a single value, spread the promise's value across
  separate arguments:

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

p2.concat(p3).map(console.log); //=> [ 'bar', 'baz' ]

p.conjoin(p2).map(console.log); //=> [ 'Foo', 'bar' ]

Promise.of([]).append(p).append(p2).map(console.log);
//=> [ 'Foo', [ 'bar' ] ]

p2.append(p).explode(function (x, y) {
  console.log(x); //=> 'bar'
  console.log(y); //=> 'Foo'
});
```

## API Documentation

### `Promise()`

```javascript
var promise = new Promise();
```

Create a new, unfulfilled promise that will eventually be populated with a
value (through `resolve`).

### `Promise.of(x)`

```javascript
var promise = Promise.of(1);
var promise = Promise.of('foo');
```

Create a new, fulfilled promise already populated with a value `x`.

### `Promise#resolve(x)`

```javascript
var promise = new Promise();
promise.resolve(5);
```

Populate a promise with the value `x` thereby resolving it.

### `Promise#map(f)`

```javascript
var promise = Promise.of(2);

promise.map(function (x) {
  console.log(x);

  return x * 2;
}); //=> Promise.of(4)
```

Execute a function `f` on the contents of the promise. This returns a new
promise containing the result of applying `f` to the initial promise's value.

In [Haskell](http://www.haskell.org) notation, its type signature is:

```haskell
map :: Promise a -> (a -> b) -> Promise b
```

Note that this is the primary way of acting on the value of a promise: you can
use side-effects within your given function (e.g. `console.log`) as well as
modifying the value and returning it in order to affect the returning
promise.

### `Promise#concat(p)`

```javascript
var promise = Promise.of('foo'),
    promise2 = Promise.of('bar');

promise.concat(promise2); //=> Promise.of('foobar')
```

Concatenate the promise with another promise `p` into one containing both
values concatenated together. This will work for any promise containing a
semigroup (viz. a value that supports `concat`) such as `String` or `Array`.
Note that [`concat`'s usual
behaviour](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/concat)
of joining arrays, etc. applies.

Its type signature is:

```haskell
concat :: Promise a -> Promise a -> Promise a
```

See also `Promise#conjoin` and `Promise#append`.

### `Promise#chain(f)`

```javascript
var promise = Promise.of(2);

promise.chain(function (x) { return Promise.of(x * 2); }); //=> Promise.of(4)
```

Execute a function `f` with the value of the promise. This differs from
`Promise#map` in that the function *must* return a promise itself.

Its type signature is:

```haskell
chain :: Promise a -> (a -> Promise b) -> Promise b
```

### `Promise#ap(p)`

```javascript
var promise = Promise.of(function (x) { return x * 2; }),
    promise2 = Promise.of(2);

promise.ap(promise2); //=> Promise.of(4)
```

On a promise containing a function, call that function with a promise `p`
containing a value.

Its type signature is:

```haskell
ap :: Promise (a -> b) -> Promise a -> Promise b
```

### `Promise#empty()`

```javascript
var promise = Promise.of('woo');

promise.empty(); //=> Promise.of('')
```

On a promise containing a monoid (viz. something with an `empty()` function on
itself or its constructor like `Array` or `String`), return a new promise with
an empty version of the initial value.

### `Promise#conjoin(p)`

```javascript
var promise = Promise.of(1),
    promise2 = Promise.of([2, 3]);

promise.conjoin(promise2); //=> Promise.of([1, 2, 3])
```

Conjoin the promise with another promise `p`, converting their values to
arrays if needed (e.g. `'foo'` into `['foo']`). This differs from `concat`
which only works on promises of values that are semigroups themselves.

All values are coerced to arrays using `[].concat`.

### `Promise#append(p)`

```javascript
var promise = Promise.of([]),
    promise2 = Promise.of([1]);

promise.append(promise2); //=> Promise.of([[1]])
```

On a promise of a list, append another promise `p`'s value to it without
joining (e.g. appending `[1]` to `[]` results in `[[1]]` rather than `[1]` as
it would with `concat` and `conjoin`).

This is particularly useful when dealing with several promises containing
lists and you want to keep them separated instead of being merged into one as
would happen with `concat`.

### `Promise#spread(f)`

```javascript
var promise = Promise.of([1, 2]);

promise.spread(function (x, y) {
  return x + y;
}); //=> Promise.of(3)
```

Similar to `map`, apply a function `f` to a promise of a list but, instead
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

