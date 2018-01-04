var path = require("path");
var fs = require("fs");
var _ = require('lodash');

var resultsJson = fs.readFileSync('results.json', { encoding: "utf-8" });
var results = JSON.parse(resultsJson);

console.log('Some stats:');

const groupedResult = _.countBy(results, 'readerable');
console.log('Result counts by readerable attribute: ', groupedResult);
