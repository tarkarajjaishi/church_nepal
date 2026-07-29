# Load Testing Scripts

This directory contains k6 scripts for load testing the application.

## Scripts

1. [provisioning.js](provisioning.js) - Tests the creation of new churches (POST /api/churches)
2. [giving.js](giving.js) - Tests processing donations (POST /api/donations)
3. [public-reads.js](public-reads.js) - Tests fetching public data (GET /api/churches/:id)

## Thresholds

Each script defines the following performance thresholds:

- **provisioning.js** and **giving.js**:
  - 95% of requests must complete within 500ms
  - Error rate must be less than 1%

- **public-reads.js**:
  - 95% of requests must complete within 300ms
  - Error rate must be less than 1%

## Load Profile

Each script follows the same load pattern:
- Ramp up to 100 (or 200 for reads) virtual users over 2 minutes
- Sustain that load for 5 minutes
- Ramp down to 0 over 2 minutes

## Running the Tests

Ensure k6 is installed and the application is running locally on port 3000.

To run a script:

```bash
k6 run provisioning.js
```

To run a test with output to a CSV file for further analysis:

```bash
k6 run --out csv=provisioning_results.csv provisioning.js
```

To run all tests sequentially:

```bash
k6 run provisioning.js
k6 run giving.js
k6 run public-reads.js
```

## Notes

- These scripts assume the API is running on `localhost:3000`. Adjust the host and port as needed.
- The payloads in the scripts are examples and may need to be adjusted to match your API's expected schema.
- For authentication, if required, you would need to add appropriate headers (like Authorization) to the requests.