# Readability.js - Batch CSV Fork

Fork reason: Modified the generate-testcase script to read from urls.csv (lines of "slug,url") to generate test-cases from as well as save results.json which includes the url and readerable flag as determined by readability.

## Usage

Create urls.csv in the test folder, then run generate-testcase.js:

```
cd test
echo 'google,https://google.com
fintech,https://medium.com/at-the-front-line/european-fintech-trends-2017-59db5c8e55e3
fileaccess,https://medium.freecodecamp.org/speed-up-file-access-in-docker-for-mac-fbeee65d0ee7' > urls.csv
node generate-testcase.js
```

The results are stored in results.json in the same directory.
