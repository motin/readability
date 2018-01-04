FS=$(find . -name 'failure.json' | wc -l)
SS=$(find . -name 'expected-metadata.json' | wc -l)
SCANNED=$(find . -name 'md5_*' | wc -l)

echo "Scanned $SCANNED, with $SS successes and $FS failures"
