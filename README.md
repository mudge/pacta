# Pacta [![Build Status](https://travis-ci.org/mudge/pacta.png?branch=master)](https://travis-ci.org/mudge/pacta)

An [algebraic][Fantasy Land] implementation of [ECMAScript 2015][ECMAScript]
and [Promises/A+][A+] Promises in JavaScript for as many browsers and
[Node.js](http://nodejs.org) versions as possible.

**Current version:** 0.9.0  
**Supported Node.js versions:** 0.6, 0.8, 0.10, 0.11, 0.12, 4.0, 4.1, 5.0  
**Supported browsers:** Internet Explorer 6+, Firefox 3.6+, Chrome 14+, Opera 10.6+, Safari 4+, iOS 3+, Windows Phone 8.1, Android 2.2+

```javascript
var promise = new Promise(function (resolve, reject) {
    setTimeout(function () { resolve('Hello'); }, 5000);
    setTimeout(function () { reject('Timeout!'); }, 60000);
});

promise
    .then(function (value) { return value + ', World!'; })
    .catch(function (reason) { return 'Sorry'; })
    .then(console.log); //=> Hello, World!
```

## Installation

```shell
$ npm install pacta   # for Node.js
$ bower install pacta # for the browser
```

Alternatively, include `pacta.js` via a `<script/>` in your page (Pacta also
supports using an [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md)
API-compliant loader such as [RequireJS](http://requirejs.org/)).

## Promises

Promises can be thought of as objects representing a value that may not have
been calculated yet (they are sometimes referred to as `Deferred`s).

An obvious example is the result of an asynchronous HTTP request: it's not
clear *when* the request will be fulfilled but it will be at some point in the
future. Having actual Promise objects representing these eventual values
allows you to compose, transform and act on them without worrying about their
time or sequence of execution.

At their most basic, an empty promise can be created and resolved like so:

```javascript
var Promise = require('pacta');

var p = new Promise(function (resolve) {
    setTimeout(function () {
        /* Populate the promise with its final value. */
        resolve(1);
    }, 1000);
});
```

Promises can also be marked as `rejected` (viz. represent an error state) like
so:

```javascript
var p = new Promise(function (resolve, reject) {
    /* Mark the promise as rejected with a reason. */
    reject('The server could not be found.');
});
```

Concretely, a promise can be represented by the following deterministic finite automaton:

<p align="center"><img src="images/dfa.png" width="275" height="192" alt=""></p>

For a worked example of using promises, see the [sample HTTP
client](https://github.com/mudge/pacta/blob/master/example/promised-http.js)
and [two](https://github.com/mudge/pacta/blob/master/example/codenames.js)
[example
programs](https://github.com/mudge/pacta/blob/master/example/codenames-2.js)
included in Pacta.

### ECMAScript 2015

Pacta's promises comply with the Promise API described in [ECMAScript
2015][ECMAScript] and the [Promises/A+ specification][A+]:

* [`new Promise(executor)`](#new-promiseexecutor) for constructing, resolving and rejecting promises;
* [`Promise#then(onFulfilled, onRejected)`](#promisethenonfulfilled-onrejected) for binding callbacks on promise resolution or rejection (compliant with the [Promises/A+ specification][A+]);
* [`Promise#catch(onRejected)`](#promisecatchonrejected) for dealing with rejected promises;
* [`Promise.all(iterable)`](#promisealliterable) for returning a promise that is resolved when all of the promises in an iterable resolve, or rejects with the reason of the first rejected promise;
* [`Promise.race(iterable)`](#promiseraceiterable) for returning a promise that resolves or rejects as soon as one of the promises in an iterable resolves or rejects;
* [`Promise.reject(reason)`](#promiserejectreason) for constructing rejected promises;
* [`Promise.resolve(value)`](#promiseresolvevalue) for constructing resolved promises.

### Algebraic JavaScript

The aforementioned high level functions are implemented in terms of the
algebraic primitives defined in the ["Fantasy Land" Algebraic JavaScript
Specification][Fantasy Land]:

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

These different specifications can be thought of as different levels of
abstraction with ECMAScript 2015 at the top and Fantasy Land at the bottom,
e.g.

| Specification   | Functions                                                                           |
| --------------- | ----------------------------------------------------------------------------------- |
| ECMAScript 2015 | `Promise.all`, `Promise.race`, `Promise.resolve`, `Promise.reject`, `Promise#catch` |
| Promises/A+     | `Promise#then`                                                                      |
| Fantasy Land    | `Promise#map`, `Promise#concat`, `Promise#chain`, etc.                              |

Pacta gives you access to all of these functions including the algebraic
primitives for composition into more expressive operations.

### Working with lists of promises

As well as the standard [`Promise.all`](#promisealliterable) and
[`Promise.race`](#promiseraceiterable), Pacta also provides the following
functions for creating and working with Promises of lists:

* [`Promise#conjoin`](#promiseconjoinp) to concatenate promises into a list of
  values regardless of their original type meaning that non-Monoid types can
  be combined with others (e.g. a promise of `'foo'` can be conjoined with
  `[1, 2]` to produce `['foo', 1, 2]`);
* [`Promise#append`](#promiseappendp) to append promises to an initial promise
  of a list. This means that you can work more easily with multiple promises
  of lists without joining them together (as would be done with `concat` and
  `conjoin`), e.g.  appending a promise of `[2, 3]` to a promise of `[1]`
  results in `[1, [2, 3]]` rather than `[1, 2, 3]`);
* [`Promise#reduce`](#promisereducef-initialvalue) to
  [reduce](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/Reduce)
  a list within a promise;
* [`Promise#spread`](#promisespreadf) to map over a promise's value but,
  instead of receiving a single value, spread the promise's value across
  separate arguments:

```javascript
Promise.all([1, 2]).spread(function (x, y) {
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

See [the test
suite](https://github.com/mudge/pacta/blob/master/test/pacta_test.js) for more
information.

[A+]: http://promises-aplus.github.io/promises-spec/
[Fantasy Land]: https://github.com/puffnfresh/fantasy-land
[Maybe]: https://en.wikipedia.org/wiki/Monad_(functional_programming)#The_Maybe_monad
[ECMAScript]: http://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects

## API Documentation

### `new Promise([executor])`

```javascript
var promise = new Promise();
var promise = new Promise(function (resolve, reject) {
    if (foo) {
        resolve('Huzzah!');
    } else {
        reject('Oops!');
    }
});
```

Create a new, unfulfilled promise that will eventually be populated with a
value either by an optionally passed `executor` function (which is passed a
`resolve` and a `reject` function) or by [`Promise#resolve`](#promiseresolvex)
and [`Promise#reject`](#promiserejectreason-1).

#### See also

* [Promise - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* [Promise ( executor ) - ECMAScript 2015 Language
  Specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise-executor)

### `Promise#then([onFulfilled[, onRejected]])`

```javascript
promise.then(function (value) {
    return x * 2;
}); //=> Promise.resolve(4)

promise.then(function (value) {
    return Promise.resolve(x * 2);
}); //=> Promise.resolve(4)

promise.then(function (value) {
    console.log('Success!', value);
}, function (reason) {
    console.error('Error!', reason);
});
```

An implementation of the [Promises/A+ `then`
method](http://promisesaplus.com/#the__method), taking an
optional `onFulfilled` and `onRejected` function to call when the promise is
fulfilled or rejected respectively.

Like [`Promise#map`](#promisemapf), `then` returns a promise itself and can be
chained.

*Unlike* [`Promise#map`](#promisemapf), `then` will unwrap any promise that is
returned by an `onFulfilled` or `onRejected` function (making `then` behave
like [`Promise#chain`](#promisechainf)).

#### See also

* [Promise.prototype.then() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then)
* [The `then` Method - Promises/A+](https://promisesaplus.com/#point-21)
* [Promise.prototype.then ( onFulfilled , onRejected ) - ECMAScript 2015 Language Specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise.prototype.then)

### `Promise#catch(onRejected)`

```javascript
promise.catch(function (reason) {
    console.error('Error!', reason);
});
```

An implementation of ECMAScript 2015's `catch` method, equivalent to calling
[`Promise#then`](#promisethenonfulfilled-onrejected) with an `undefined`
`onFulfilled`.

*Unlike* [`Promise#onRejected`](#promiseonrejectedf), `catch` will unwrap any
promises returned from the `onRejected` handler (making `catch` behave like
[`Promise#chainRejected`](#promisechainrejectedf)).

#### See also

* [Promise.prototype.catch() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch)
* [Promise.prototype.catch ( onRejected ) - ECMAScript 2015 Language
  Specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise.prototype.catch)

### `Promise.resolve(value)`

```javascript
var promise = Promise.resolve(5);
var promise = Promise.resolve(promise);
var promise = Promise.resolve(thenable);
```

An implementation of ECMAScript 2015's `Promise.resolve` for returning a
promise resolved with the given value.

*Unlike* [`Promise.of`](#promiseofx), if the given `value` is itself a promise
or thenable (viz. a value with a `then` method) then `Promise.resolve` will
unwrap it, resolving with its eventual state.

Note that this can be used to convert other promise implementations into Pacta
promises (and is used internally by Pacta to do so).

#### See also

* [Promise.resolve() - JavaScript |
  MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)
* [Promise.resolve ( x ) - ECMAScript 2015 Language
  Specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise.resolve)

### `Promise.reject(reason)`

```javascript
var promise = Promise.reject('error!');
var promise = Promise.reject(new TypeError('Oops!'));
```

An implementation of ECMAScript 2015's `Promise.reject` for returning a
promise rejected with a given reason.

#### See also

* [Promise.reject() - JavaScript |
  MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject)
* [Promise.reject ( r ) - ECMAScript 2015 Language
  Specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise.reject)

### `Promise.all(iterable)`

```javascript
var promise = new Promise(function (resolve, reject) {
    setTimeout(function () { resolve('foo'), 1000);
});

Promise.all(['bar', Promise.resolve(7), promise]).then(function (values) {
    console.log(values); //=> ['bar', 7, 'foo']
});
```

An implementation of ECMAScript 2015's `Promise.all` for returning a promise
that resolves when all of the promises in a given iterable have resolved or
rejects with the reason of the first passed promise that rejects.

Note that every element of the given iterable is passed to
[`Promise.resolve`](#promiseresolvevalue) to coerce it to a Pacta promise
(this includes other promises, thenables and raw values).

If any promise in the iterable is rejected, the resulting promise will
instantly reject with that promise's reason, e.g.

```javascript
var promise = new Promise(function (resolve, reject) {
    setTimeout(function () { reject('oops!'); }, 500);
});

Promise.all(['bar', promise]).catch(function (reason) {
    console.error(reason); //=> 'oops!'
});
```

#### See also

* [Promise.all() - JavaScript |
  MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
* [Promise.all ( iterable ) - ECMAScript 2015 Language
  Specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise.all)

### `Promise.race(iterable)`

```javascript
var p1 = new Promise(function (resolve) {
        setTimeout(function () { resolve('second'); }, 1000);
    }),
    p2 = new Promise(function (resolve) {
        setTimeout(function () { resolve('first!'); }, 500);
    });

Promise.race([p1, p2]).then(function (value) {
    console.log(value); //=> 'first!'
});
```

An implementation of ECMAScript 2015's `Promise.race` to return a promise that
resolves or rejects as soon as one of the promises in the iterable resolves or
rejects with the value or reason from that promise.

#### See also

* [Promise.race() - JavaScript |
  MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)
* [Promise.race ( iterable ) - ECMAScript 2015 Language
  Specification](http://www.ecma-international.org/ecma-262/6.0/#sec-promise.race)

### `Promise.of(x)`

```javascript
var promise = Promise.of(1);
var promise = Promise.of('foo');
var promise = Promise.of(Promise.of(1));
```

Create a new, fulfilled promise already populated with a value `x`.

*Unlike* [`Promise.resolve`](#promiseresolvevalue), `Promise.of` will not unwrap `x`
if it is a promise or thenable itself so it is possible to created nested
promises.

#### See also

* [`of` method - Fantasy Land
  Specification](https://github.com/fantasyland/fantasy-land#of-method)

### `Promise#resolve(x)`

```javascript
var promise = new Promise();
promise.resolve(5);
```

Populate a promise with the value `x` thereby resolving it.

*This function can also be called as `Promise#fulfill`.*

### `Promise#reject(reason)`

```javascript
var promise = new Promise();
promise.reject('Errored out!');
```

Mark a promise as rejected, populating it with a reason.

### `Promise#map(f)`

```javascript
var promise = Promise.of(2);

promise.map(function (x) {
    console.log(x);

    return x * 2;
}); //=> Promise.of(4)

promise.map(function (x) {
    return Promise.of(x * 2);
}); //=> Promise.of(Promise.of(4))
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

Note that any uncaught exceptions during the execution of `f` will result in
the promise being `rejected` with the exception as its `reason`.

#### See also

* [`map` method - Fantasy Land
  Specification](https://github.com/fantasyland/fantasy-land#map-method)

### `Promise#onRejected(f)`

```javascript
var p = new Promise();
p.reject('Error!');
p.onRejected(function (reason) {
    console.error('Failed:', reason);
});
```

Identical to [`Promise#map`](#promisemapf) but only executed when a promise is
rejected rather than resolved.

Note that `onRejected` returns a promise itself that is fulfilled by the given
function, `f`. In this way, you can gracefully recover from errors like so:

```javascript
var p = new Promise();
p.reject('Error!');

p.onRejected(function (reason) {
    return 'Some safe default';
}).map(console.log);
//=> Logs "Some safe default"
```

Like [`Promise#map`](#promisemapf), any uncaught exceptions within `f` will
result in a `rejected` promise:

```javascript
var p = new Promise();
p.reject('Error!');

p.onRejected(function (reason) {
    throw 'Another error!';
}).onRejected(console.log);
//=> Logs "Another error!"
```

### `Promise#chain(f)`

```javascript
var promise = Promise.of(2);

promise.chain(function (x) { return Promise.of(x * 2); }); //=> Promise.of(4)
```

Execute a function `f` with the value of the promise. This differs from
[`Promise#map`](#promisemapf) in that the function *must* return a promise
itself.

Its type signature is:

```haskell
chain :: Promise a -> (a -> Promise b) -> Promise b
```

#### See also

* [`chain` method - Fantasy Land
  Specification](https://github.com/fantasyland/fantasy-land#chain-method)

### `Promise#chainRejected(f)`

```javascript
var promise = new Promise(function (resolve, reject) {
    reject('error!');
});

promise.chainRejected(function (reason) {
    return Promise.of('Phew!');
}); //=> Promise.of('Phew!')
```

Identical to [`Promise#chain`](#promisechainf) but only executed when a
promise is rejected rather than resolved.

*This function can also be called as `Promise#chainError`.*

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

#### See also

* [`ap` method - Fantasy Land Specification](https://github.com/fantasyland/fantasy-land#ap-method)

### `Promise#empty()`

```javascript
var promise = Promise.of('woo');

promise.empty(); //=> Promise.of('')
```

On a promise containing a monoid (viz. something with an `empty()` function on
itself or its constructor like `Array` or `String`), return a new promise with
an empty version of the initial value.

(Pacta ships with Monoid implementations for `Array` and `String` by default.)

#### See also

* [`empty` method - Fantasy Land Specification](https://github.com/fantasyland/fantasy-land#empty-method)

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

If either of the original two promises is rejected, the resulting concatenated
promise will also be rejected. Note that only the first rejection will count
as further rejections will be ignored.

### See also

* [`Promise#conjoin`](#promiseconjoinp)
* [`Promise#append`](#promiseappendp)
* [`concat` method - Fantasy Land
  Specification](https://github.com/fantasyland/fantasy-land#concat-method)

### `Promise#conjoin(p)`

```javascript
var promise = Promise.of(1),
    promise2 = Promise.of([2, 3]);

promise.conjoin(promise2); //=> Promise.of([1, 2, 3])
```

Conjoin the promise with another promise `p`, converting their values to
arrays if needed (e.g. `'foo'` into `['foo']`). This differs from
[`Promise#concat`](#promiseconcatp) which only works on promises of values
that are semigroups themselves.

All values are coerced to arrays using `[].concat`.

### `Promise#append(p)`

```javascript
var promise = Promise.of([]),
    promise2 = Promise.of([1]);

promise.append(promise2); //=> Promise.of([[1]])
```

On a promise of a list, append another promise `p`'s value to it without
joining (e.g. appending `[1]` to `[]` results in `[[1]]`).

This is particularly useful when dealing with several promises containing
lists and you want to keep them separated instead of being merged into one as
would happen with [`Promise#concat`](#promiseconcatp) and
[`Promise#conjoin`](#promiseconjoinp).

### `Promise#reduce(f[, initialValue])`

```javascript
var promise = Promise.of([1, 2, 3]);

promise.reduce(function (acc, e) {
    return acc + e;
}, 0); //=> Promise.of(6)
```

On a promise containing an array,
[reduce](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/Reduce)
its value, returning a promise of the resulting value. This defers to the
underlying signature of `reduce` taking a function `f` and an optional
`initialValue`.

### `Promise#spread(f)`

```javascript
var promise = Promise.of([1, 2]);

promise.spread(function (x, y) {
    return x + y;
}); //=> Promise.of(3)
```

Similar to [`Promise#map`](#promisemapf), apply a function `f` to a promise of
a list but, instead of receiving a single argument, pass each value of the
list to the function separately.

## Contributors

* Fixes to `chain`, `chainError` and `empty` were contributed by [Ben
  Schulz](https://github.com/benschulz);
* `mapError` and `chainError` were contributed by [Rodolphe
  Belouin](https://github.com/rbelouin).

## Acknowledgements

[James
Coglan](http://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/)
and [Aanand Prasad](http://aanandprasad.com/articles/negronis/) convinced me
to explore the idea of monadic promises and [Brian McKenna's "Fantasy Land"
specification](https://github.com/puffnfresh/fantasy-land) and
[feedback](https://github.com/mudge/pacta/issues/1) were essential.

[![Fantasy Land](images/fantasy-land.png)][Fantasy Land] [![Promises/A+](images/promises-aplus.png)][A+]

## License

Copyright © 2013—2015 Paul Mucur.

Distributed under the MIT License.

