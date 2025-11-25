# Setup Instructions

Follow these steps to get your DDP Performance Testing Suite up and running.

## Step 1: Install NPM Dependencies

```bash
npm install
```

This will install:
- `puppeteer` - For load testing
- `recharts` - For charts
- `date-fns` - For date formatting

## Step 2: Install Meteor Packages

Since we added the `react-meteor-data` package, you need to let Meteor install it:

```bash
meteor npm install
```

The Meteor package will be automatically installed when you first start the server, or you can manually add it:

```bash
meteor add react-meteor-data
```

## Step 3: Verify Installation

Check that everything is installed:

```bash
# Check NPM packages
npm list --depth=0

# You should see:
# ├── puppeteer@24.31.0
# ├── recharts@2.10.0
# ├── date-fns@2.30.0
# (plus other dependencies)
```

## Step 4: Start the Server

```bash
npm start
```

Or:

```bash
meteor run
```

**Expected output:**
```
=> Started proxy.
=> Started HMR server.
=> Started MongoDB.
=> Started your app.
=> App running at: http://localhost:3000/
```

## Step 5: Verify Dashboard

Open your browser to `http://localhost:3000`

You should see:
- 🚀 **DDP Performance Dashboard** header
- A message saying "No Test Results Yet"
- Instructions to run `node load-test.js`

## Step 6: Run Your First Test

Open a **new terminal** (keep the server running in the first one) and run:

```bash
node load-test.js --clients 10 --duration 30000
```

This runs a quick 30-second test with 10 clients (good for testing setup).

**Expected output:**
```
============================================================
DDP PERFORMANCE LOAD TEST ORCHESTRATOR
============================================================
Server: http://localhost:3000
Test Duration: 30s per test
Client Counts: 10
============================================================

[Test 1/1]
Starting test with 10 clients
Duration: 30 seconds
============================================================

Initializing test session on server...
Test session created: ...
Launching browser...
Launching 10 client pages...
  Launched: 10/10
✓ Successfully launched 10/10 clients

Running test for 30 seconds...
✓ Test duration complete
...
```

## Step 7: View Results

Go back to your browser at `http://localhost:3000`

You should now see:
- ✅ Summary card for "10 Clients"
- ✅ Performance charts
- ✅ Detailed results table
- ✅ Export buttons

## Step 8: Run Full Test Suite (Optional)

Once you've verified everything works, run the full test suite:

```bash
node load-test.js
```

This will test with 10, 50, 100, and 500 clients (takes ~4-5 minutes).

## Troubleshooting

### Issue: Port 3000 already in use

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Then restart
npm start
```

### Issue: Puppeteer can't find Chrome

**macOS:**
```bash
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

**Linux:**
```bash
# Install Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser

# Or set path
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Issue: "Cannot find module 'recharts'"

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
meteor npm install
```

### Issue: Meteor packages not found

```bash
# Reset Meteor
meteor reset

# Restart
npm start
```

### Issue: No data in dashboard after running tests

1. Check that server is running
2. Check browser console for errors (F12)
3. Try running a test while watching the server logs
4. Verify MongoDB is running (it should start automatically with Meteor)

## Verification Checklist

Before your presentation, verify:

- [ ] Server starts without errors
- [ ] Dashboard loads at `http://localhost:3000`
- [ ] Test with 10 clients completes successfully
- [ ] Results appear in dashboard
- [ ] Charts render correctly
- [ ] Export buttons work (CSV, JSON, Summary)
- [ ] Real-time metrics update during test
- [ ] No console errors in browser

## Quick Commands Reference

```bash
# Start server
npm start

# Run all tests
node load-test.js

# Run specific client counts
node load-test.js --clients 10,50

# Run with custom duration
node load-test.js --duration 30000

# View help
node load-test.js --help

# Clear all test data (in browser console)
Meteor.call('testResults.clear')

# Stop server
Ctrl + C
```

## File Locations

- **Configuration**: `config/testConfig.js`
- **Test Results**: `test-results/` (created automatically)
- **Server Logs**: Terminal where `npm start` is running
- **MongoDB Data**: `.meteor/local/db/`

## What to Expect

### First Run
- Puppeteer downloads Chromium (~200MB) - only once
- Meteor builds the app - takes 30-60 seconds
- MongoDB starts automatically

### During Tests
- Headless browsers launch (invisible)
- Progress shown in terminal
- Results saved to `test-results/`
- Live updates in dashboard

### After Tests
- Browsers close automatically
- Results persist until server restart (or use persistent MongoDB)
- Export files available in `test-results/`

## Next Steps

1. ✅ Run the setup steps above
2. ✅ Run your first test
3. ✅ Explore the dashboard
4. ✅ Read `QUICKSTART.md` for more details
5. ✅ Customize `config/testConfig.js` for your needs
6. ✅ Prepare for your presentation!

## Need More Help?

- 📖 **Full documentation**: See `README.md`
- 🚀 **Quick start**: See `QUICKSTART.md`
- 📋 **Implementation details**: See `IMPLEMENTATION_SUMMARY.md`

---

**Ready to go!** 🎉 Run `npm start` and `node load-test.js` to begin.

