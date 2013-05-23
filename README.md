# pacta [![Build Status](https://travis-ci.org/mudge/pacta.png?branch=master)](https://travis-ci.org/mudge/pacta)

This is an in-progress experiment to explore Promises in
[node.js](http://nodejs.org) having been convinced by [James
Coglan](http://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/)
and [Aanand Prasad](http://aanandprasad.com/articles/negronis/).

At the moment, pacta's promises are [semigroups](https://github.com/puffnfresh/fantasy-land#semigroup) and [functors](https://github.com/puffnfresh/fantasy-land#functor) (providing only `map` and `concat`).

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

p.map(console.log); //=> "Foo"

p.map(function (x) {
  return x + '!';
}).map(console.log); //=> "Foo!"

p.concat(p2).map(console.log); //=> "Foo bar"
```
