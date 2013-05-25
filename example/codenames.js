var http = require('./promised-http'),
    getJSON = http.getJSON;

var random = function (coll) {
    return coll[Math.floor(Math.random() * coll.length)];
};

var promisedPrefixes   = getJSON('http://codenames.clivemurray.com/data/prefixes.json'),
    promisedAnimals    = getJSON('http://codenames.clivemurray.com/data/animals.json'),
    prefixesAndAnimals = promisedPrefixes.combine(promisedAnimals);

var promisedCodeName = function () {
    return prefixesAndAnimals.explode(function (prefixes, animals) {
        var prefix = random(prefixes),
            animal = random(animals);

        return prefix.title + animal.title;
    });
};

promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
promisedCodeName().map(console.log);
