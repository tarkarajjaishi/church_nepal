#!/bin/bash

# Run all load tests and capture results
set -e

echo "Running provisioning test..."
k6 run provisioning.js --out json=provisioning-results.json

echo "Running giving test..."
k6 run giving.js --out json=giving-results.json

echo "Running public reads test..."
k6 run public-reads.js --out json=public-reads-results.json

echo "All tests completed. Results saved as JSON files."

# Optional: Generate a summary report
echo "Generating summary report..."
cat > summary.md << EOF
# Load Test Results Summary

## Provisioning Test
See provisioning-results.json for detailed results.

## Giving Test
See giving-results.json for detailed results.

## Public Reads Test
See public-reads-results.json for detailed results.

## Thresholds
All tests were run with the following thresholds:
- 95% of requests must complete within 500ms (provisioning/giving) or 300ms (public reads)
- Error rate must be less than 1%

Check the JSON files for actual metrics.
EOF

echo "Summary written to summary.md"