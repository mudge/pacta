/* A simple demonstration of using Pacta to compose asynchronous HTTP requests.
 *
 * First, see examples/codename.js for background information on what this
 * program does and one approach to solve the proble.
 *
 * This alternate version doesn't use getJSON but actually combines the two
 * responses from the web service into an array of strings using conjoin. These
 * two values are then parsed ready for use with map or spread.
 */
var http = require('./promised-http');

var random = function (coll) {
    return coll[Math.floor(Math.random() * coll.length)];
};

var promisedPrefixesJSON = http.get('http://codenames.clivemurray.com/data/prefixes.json'),
    promisedAnimalsJSON  = http.get('http://codenames.clivemurray.com/data/animals.json'),
    prefixesAndAnimals = promisedPrefixesJSON.
        conjoin(promisedAnimalsJSON).
        spread(function (prefixes, animals) {
            return [JSON.parse(prefixes), JSON.parse(animals)];
        });

var promisedCodeName = function () {
    return prefixesAndAnimals.spread(function (prefixes, animals) {
        var prefix = random(prefixes),
            animal = random(animals);

        return prefix.title + animal.title;
    });
};

promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
