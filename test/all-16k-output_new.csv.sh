#!/usr/bin/env bash

set -x
set -o
set -e

node generate-testcase.js output_new.csv.split.1000.aa
node generate-testcase.js output_new.csv.split.1000.ab
node generate-testcase.js output_new.csv.split.1000.ac
node generate-testcase.js output_new.csv.split.1000.ad
node generate-testcase.js output_new.csv.split.1000.ae
node generate-testcase.js output_new.csv.split.1000.af
node generate-testcase.js output_new.csv.split.1000.ag
node generate-testcase.js output_new.csv.split.1000.ah
node generate-testcase.js output_new.csv.split.1000.ai
node generate-testcase.js output_new.csv.split.1000.aj
node generate-testcase.js output_new.csv.split.1000.ak
node generate-testcase.js output_new.csv.split.1000.al
node generate-testcase.js output_new.csv.split.1000.am
node generate-testcase.js output_new.csv.split.1000.an
node generate-testcase.js output_new.csv.split.1000.ao
node generate-testcase.js output_new.csv.split.1000.ap

exit 0
