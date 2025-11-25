# Quick Start Guide

Get up and running with the DDP Performance Testing Suite in under 5 minutes.

## Prerequisites

- Node.js 14+ installed
- Meteor 3.x installed (install via `curl https://install.meteor.com/ | sh`)

## Step 1: Install Dependencies

```bash
# Install npm packages
npm install

# Install Meteor packages
meteor npm install
```

## Step 2: Start the Server

```bash
npm start
```

Wait for the message: "App running at: http://localhost:3000"

## Step 3: Run Load Tests

Open a new terminal window and run:

```bash
node load-test.js
```

This will:
- Test with 10, 50, 100, and 500 concurrent clients
- Run each test for 60 seconds
- Save results to `test-results/` directory
- Take approximately 4-5 minutes total

## Step 4: View Results

Open your browser to `http://localhost:3000`

You'll see:
- 📊 Real-time metrics (if a test is running)
- 📈 Performance comparison charts
- 📋 Detailed results table
- 💾 Export options (CSV, JSON, Summary)

## Quick Commands

```bash
# Run tests with specific client counts
node load-test.js --clients 10,50

# Run shorter tests (30 seconds each)
node load-test.js --duration 30000

# Test remote server
node load-test.js --server http://your-server:3000

# Combine options
node load-test.js --server https://my-app.com --clients 10,50 --duration 30000

# View all options
node load-test.js --help

# Clear all test data (from browser console)
Meteor.call('testResults.clear')
```

## What to Expect

### During Tests
- Browser windows will open automatically (headless)
- Progress shown in terminal
- Live metrics visible in dashboard

### After Tests
- Results automatically saved
- Charts update in real-time
- Export options available

## Example Output

```
============================================================
DDP PERFORMANCE LOAD TEST ORCHESTRATOR
============================================================
Server: http://localhost:3000
Test Duration: 60s per test
Client Counts: 10, 50, 100, 500
============================================================

[Test 1/4]
Starting test with 10 clients...
✓ Successfully launched 10/10 clients
Running test for 60 seconds...
✓ Test duration complete

TEST RESULTS
Clients: 10
Throughput: 9.87 msg/s
Latency:
  Average: 12.34ms
  P95: 18.56ms
  P99: 23.12ms
```

## Troubleshooting

**Problem**: Server won't start
- Solution: Make sure port 3000 is free: `lsof -ti:3000 | xargs kill -9`

**Problem**: Puppeteer errors
- Solution: Install Chrome/Chromium: `sudo apt-get install chromium-browser` (Linux)

**Problem**: No data in dashboard
- Solution: Run `node load-test.js` first to generate data

## Next Steps

1. ✅ Customize test parameters in `config/testConfig.js`
2. ✅ Run tests with different client counts
3. ✅ Export results for your presentation
4. ✅ Read full documentation in `README.md`

## Need Help?

Check the full README.md for:
- Detailed architecture explanation
- Configuration options
- Advanced usage
- Performance tips

