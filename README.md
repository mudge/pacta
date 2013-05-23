# pacta [![Build Status](https://travis-ci.org/mudge/pacta.png?branch=master)](https://travis-ci.org/mudge/pacta)

This is an implementation of algebraic Promises in
[node.js](http://nodejs.org) having been convinced by [James
Coglan](http://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/)
and [Aanand Prasad](http://aanandprasad.com/articles/negronis/).

Pacta's promises can be used as the following algebraic structures:

* [Semigroups](https://github.com/puffnfresh/fantasy-land#semigroup);
* [Monoids](https://github.com/puffnfresh/fantasy-land#monoid);
* [Functors](https://github.com/puffnfresh/fantasy-land#functor);
* [Applicative](https://github.com/puffnfresh/fantasy-land#applicative);
* [Chains](https://github.com/puffnfresh/fantasy-land#chain);
* [Monads](https://github.com/puffnfresh/fantasy-land#monad).

Note that Pacta does not handle errors or the concept of a failed promises as
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

var p2 = new Promise();
setTimeout(function () {
  p2.resolve('bar');
}, 500);

var p3 = Promise.of('baz');

p.map(console.log); //=> "Foo"

p.map(function (x) {
  return x + '!';
}).map(console.log); //=> "Foo!"

p.concat(p2).concat(p3).map(function (x, y, z) {
  console.log('p says: ' + x);  //=> "p says: Foo"
  console.log('p2 says: ' + y); //=> "p2 says: bar"
  console.log('p3 says: ' + z); //=> "p3 says: baz"
});
```
