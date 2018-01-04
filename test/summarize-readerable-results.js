var path = require("path");
var fs = require("fs");
var md5 = require('md5');
var _ = require('lodash');

var csvPath = process.argv[2];

var csv = require("fast-csv");

var results = [];

// allows the processing to continue despite uncaught errors being encountered
process.on('uncaughtException', function(err) {
  console.error('uncaughtException: ', err);
});

var i = 0;

csv
  .fromPath(csvPath)
  .transform(function(data) {
    if (csvPath.indexOf('output') > -1) {
      const url = data.join('');
      return ['md5_' + md5(url), url];
    }
    return data;
  })
  .on("data", function(data) {

    var csvRow = data;

    i++;
    var j = i;
    console.log('csvRow', j, csvRow);

    var slug = csvRow[0];
    var argURL = csvRow[1];
    var destRoot = path.join(__dirname, "test-pages", slug);
    var metadataDestPath = path.join(destRoot, "expected-metadata.json");
    var failureJsonPath = path.join(destRoot, "failure.json");

    // do not retry previously failed attempts
    if (fs.existsSync(failureJsonPath)) {
      console.log(j + ': Skipping previously failed ' + argURL);
      var failure = fs.readFileSync(failureJsonPath, { encoding: "utf-8" });
      results.push({
        url: argURL,
        readerable: null,
        failure: failure,
      });
      return;
    }

    // on success, collect readerable status from expected-metadata.json
    if (fs.existsSync(metadataDestPath)) {

      console.log(j + ': Success with ' + argURL);
      var metadataJson = fs.readFileSync(metadataDestPath, { encoding: "utf-8" });
      try {
        var metadata = JSON.parse(metadataJson);
        results.push({
          url: argURL,
          readerable: metadata.readerable,
        });
      } catch (err) {

        console.log('err', err);
        console.log('metadataJson', metadataJson);
        results.push({
          url: argURL,
          readerable: null,
          failure: err,
        });
      }
      return;

    }

  })
  .on("end", async function() {
    console.log("done reading csv");

    console.log('Storing results.json');
    fs.writeFile('./results.json', JSON.stringify(results, null, 2) + "\n", function(resultsWriteErr) {
      if (resultsWriteErr) {
        console.error("Couldn't write data to results.json!");
        console.error(resultsWriteErr);
      }

      process.exit(0);
    });

  });
