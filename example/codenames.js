var http = require('http'),
    Promise = require('../lib/pacta').Promise;

var promisedJSON = function (url) {
    var promise = new Promise();
    http.get(url, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            promise.resolve(JSON.parse(body));
        });
    });

    return promise;
};

var random = function (coll) {
    return coll[Math.floor(Math.random() * coll.length)];
};

var promisedPrefixes = promisedJSON('http://codenames.clivemurray.com/data/prefixes.json'),
    promisedAnimals = promisedJSON('http://codenames.clivemurray.com/data/animals.json'),
    prefixesAndAnimals = promisedPrefixes.concat(promisedAnimals);

var promisedCodeName = function () {
    return prefixesAndAnimals.map(function (prefixes, animals) {
        var prefix = random(prefixes),
            animal = random(animals);

        return prefix.title + animal.title;
    });
}

promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
