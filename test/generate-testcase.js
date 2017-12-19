var debug = true;

var path = require("path");
var fs = require("fs");
var jsdom = require("jsdom").jsdom;
var prettyPrint = require("./utils").prettyPrint;
var serializeDocument = require("jsdom").serializeDocument;
var http = require("http");
var urlparse = require("url").parse;

var readability = require("../index");
var Readability = readability.Readability;
var JSDOMParser = readability.JSDOMParser;

var FFX_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:38.0) Gecko/20100101 Firefox/38.0";

/*
if (process.argv.length < 3) {
  console.error("Need at least a destination slug and potentially a URL (if the slug doesn't have source).");
  process.exit(0);
  throw "Abort";
}

var slug = process.argv[2];
var argURL = process.argv[3]; // Could be undefined, we'll warn if it is if that is an issue.
*/

var csv = require("fast-csv");

var promises = [];

//var results = [];

// allows the processing to continue despite uncaught errors being encountered
process.on('uncaughtException',function(err) {
  console.error('uncaughtException: ', err);
});

var i = 0;

//var urls = [];
csv
  .fromPath("urls.csv")
  .on("data", async function(data) {

    promises.push(new Promise(async function(resolve, reject) {

      var csvRow = data;

      console.log('csvRow', ++i, csvRow);
      //urls.push(csvRow);
      //process.exit(0);

      var slug = csvRow[0];
      var argURL = csvRow[1];
      var destRoot = path.join(__dirname, "test-pages", slug);
      var metadataDestPath = path.join(destRoot, "expected-metadata.json");
      var failureJsonPath = path.join(destRoot, "failure.json");

      // do not retry previously failed attempts
      if (fs.existsSync(failureJsonPath)) {
        console.log('Skipping previously failed ' + argURL);
        /*
        var failure = fs.readFileSync(failureJsonPath, { encoding: "utf-8" });
        results.push({
          url: argURL,
          readerable: null,
          failure: failure,
        });
        */
        resolve();
        return;
      }

      // only attempt to generate test-case if we have not already done so
      if (!fs.existsSync(metadataDestPath)) {
        try {
          console.log('Attempting ' + argURL);
          await generateTestCase(slug, argURL, destRoot);
        } catch (err) {
          // ignore errors
          console.error('test-case generation failed: ', err);
        }
      }

      // on success, collect readerable status from expected-metadata.json
      if (fs.existsSync(metadataDestPath)) {

        console.log('Success with ' + argURL);
        /*
        var metadataJson = fs.readFileSync(metadataDestPath, { encoding: "utf-8" });
        var metadata = JSON.parse(metadataJson);
        results.push({
          url: argURL,
          readerable: metadata.readerable,
        });
        */
        resolve();
        return;

      } else {

        console.log('Failure with ' + argURL);

        var failure = {
          type: 'No expected-metadata.json written',
          when: new Date()
        };

        // mark this url as defunct since we have tried to generate a test-case for it but failed
        fs.writeFile(failureJsonPath, JSON.stringify(failure, null, 2), async function(err) {
          if (err) {
            console.error("Couldn't write data to " + failureJsonPath);
            console.error(err);
            return;
          }
          /*
          results.push({
            url: argURL,
            readerable: null,
            failure: failure,
          });
          */
          resolve();
          return;

        });

      }

    }));

  })
  .on("end", async function() {
    console.log("done reading csv");

    console.log('Wait for all outstanding promises to be completed...');
    await Promise.all(promises);

    console.log('Storing results.json');
    fs.writeFile('./results.json', JSON.stringify(results, null, 2) + "\n", function(resultsWriteErr) {
      if (resultsWriteErr) {
        console.error("Couldn't write data to results.json!");
        console.error(resultsWriteErr);
      }

      process.exit(0);
    });

  });

async function generateTestCase(slug, argURL, destRoot) {
if (debug) {
  console.log("generateTestCase", slug, argURL, destRoot);
}
return new Promise(function (resolve, reject) {
fs.mkdir(destRoot, async function(err) {
  if (err) {
    var sourceFile = path.join(destRoot, "source.html");
    fs.exists(sourceFile, async function(exists) {
      if (exists) {
        fs.readFile(sourceFile, {encoding: "utf-8"}, async function(readFileErr, data) {
          if (readFileErr) {
            console.error("Source existed but couldn't be read?");
            process.exit(1);
            return;
          }
          await onResponseReceived(data);
          resolve();
        });
      } else {
        await fetchSource(argURL, onResponseReceived);
        resolve();
      }
    });
    return;
  }
  await fetchSource(argURL, onResponseReceived);
  resolve();
});

async function fetchSource(url, callbackFn) {
  return new Promise(function (resolve, reject) {
  if (!url) {
    console.error("You should pass a URL if the source doesn't exist yet!");
    process.exit(1);
    return;
  }
  var client = http;
  if (url.indexOf("https") == 0) {
    client = require("https");
  }
  var options = urlparse(url);
  options.headers = {'User-Agent': FFX_UA};

  try {
    if (debug) {
      console.log("Requesting URL:", url);
    }
  client.get(options, function(response) {
    if (debug) {
      console.log("STATUS:", response.statusCode);
      console.log("HEADERS:", JSON.stringify(response.headers));
    }
    response.setEncoding("utf-8");
    var rv = "";
    response.on("data", function(chunk) {
      rv += chunk;
    });
    response.on("error", function (err) {
      console.error(err);
      reject(err);
    });
    response.on("end", async function() {
      if (debug) {
        console.log("End received");
      }
      // Sanitize:
      rv = prettyPrint(serializeDocument(jsdom(rv)));
      await callbackFn(rv);
      resolve();
    });
  });
  } catch (err) {
    reject(err);
  }
  });
}

async function onResponseReceived(source) {
  return new Promise(function (resolve, reject) {
  if (debug) {
    console.log("Request received. Writing source.html");
  }
  var sourcePath = path.join(destRoot, "source.html");
  fs.writeFile(sourcePath, source, async function(err) {
    if (err) {
      console.error("Couldn't write data to source.html!");
      console.error(err);
      return;
    }
    if (debug) {
      console.log("Running readability stuff");
    }
    await runReadability(source, path.join(destRoot, "expected.html"), path.join(destRoot, "expected-metadata.json"));
    resolve();
  });
  });
}

async function runReadability(source, destPath, metadataDestPath) {
  return new Promise(function (resolve, reject) {
  try {
    var doc = new JSDOMParser().parse(source);
  } catch (ex) {
    if (debug) {
      console.error(ex);
      ex.stack.forEach(console.log.bind(console));
    }
  }
  var uri = {
    spec: "http://fakehost/test/page.html",
    host: "fakehost",
    prePath: "http://fakehost",
    scheme: "http",
    pathBase: "http://fakehost/test/"
  };
  var myReader, result, readerable;
  try {
    // We pass `caption` as a class to check that passing in extra classes works,
    // given that it appears in some of the test documents.
    myReader = new Readability(uri, doc, { classesToPreserve: ["caption"] });
    result = myReader.parse();
  } catch (ex) {
    if (debug) {
      console.error(ex);
      ex.stack.forEach(console.log.bind(console));
    }
  }
  // Use jsdom for isProbablyReaderable because it supports querySelectorAll
  try {
    var jsdomDoc = jsdom(source, {
      features: {
        FetchExternalResources: false,
        ProcessExternalResources: false
      }
    });
    myReader = new Readability(uri, jsdomDoc);
    readerable = myReader.isProbablyReaderable();
  } catch (ex) {
    if (debug) {
      console.error(ex);
      ex.stack.forEach(console.log.bind(console));
    }
  }
  if (!result) {
    console.error("No content generated by readability, not going to write expected.html!");
    resolve();
    return;
  }

  fs.writeFile(destPath, prettyPrint(result.content), function(fileWriteErr) {
    if (fileWriteErr) {
      console.error("Couldn't write data to expected.html!");
      console.error(fileWriteErr);
      return;
    }

    // Delete the result data we don't care about checking.
    delete result.uri;
    delete result.content;
    delete result.textContent;
    delete result.length;

    // Add isProbablyReaderable result
    result.readerable = readerable;

    fs.writeFile(metadataDestPath, JSON.stringify(result, null, 2) + "\n", function(metadataWriteErr) {
      if (metadataWriteErr) {
        console.error("Couldn't write data to expected-metadata.json!");
        console.error(metadataWriteErr);
      }

      resolve();
    });
  });
  });
}
});
}
