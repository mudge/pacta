/*global describe */
'use strict';

var adapter = require('./pacta_adapter');

describe('Promises/A+ compliance', function () {
    require('promises-aplus-tests').mocha(adapter);
});
