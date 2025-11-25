# DDP Performance Testing Suite

A comprehensive performance testing and analysis tool for Meteor.js DDP (Distributed Data Protocol). This application allows you to measure and visualize DDP performance metrics across different client loads.

## Features

- 🚀 **Automated Load Testing**: Test with 10, 50, 100, and 500 concurrent clients
- 📊 **Real-time Monitoring**: Live metrics display during active tests
- 📈 **Comprehensive Analytics**: Latency (avg, P50, P95, P99), throughput, success rates
- 🎨 **Presentation-Ready Dashboard**: Beautiful UI designed for presentations
- 💾 **Export Capabilities**: Export results as CSV, JSON, or summary reports
- 🔄 **Hybrid Metrics Collection**: Both server-side aggregate and per-client metrics
- 📉 **Historical Comparison**: Compare performance across different client counts

## Installation

### Development Setup

1. Start MongoDB in Docker:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. Install dependencies:
```bash
npm install
meteor npm install
```

See [DEV_SETUP.md](./DEV_SETUP.md) for complete development guide.

## Usage

### 1. Start the Meteor Server

```bash
npm start
# or
meteor run
```

The server will start on `http://localhost:3000`

### 2. View the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

You'll see the performance dashboard with historical test results (once tests are run).

### 3. Run Load Tests

In a separate terminal, run the load test orchestrator:

```bash
# Run all tests (10, 50, 100, 500 clients)
node load-test.js

# Run specific client counts
node load-test.js --clients 10,50

# Custom test duration (in milliseconds)
node load-test.js --duration 30000

# View help
node load-test.js --help
```

### 4. View Results

- **Real-time**: The dashboard automatically updates during active tests
- **Historical**: View completed test results in charts and tables
- **Export**: Download results as CSV, JSON, or summary reports

## Architecture

### Server-Side
- **Test Metrics Collection** (`imports/api/testMetrics.js`): Manages test sessions and aggregates metrics
- **Message Handling** (`server/main.js`): Processes DDP messages and tracks latency
- **Publications**: Exposes test results and sessions to clients

### Client-Side
- **Dashboard Mode** (default): Displays metrics and historical results
- **Test Mode** (`?test=true`): Runs as a load test client
- **Components**:
  - `Dashboard.jsx`: Main dashboard with real-time and historical views
  - `MetricsCard.jsx`: Individual metric displays with color-coded thresholds
  - `ComparisonChart.jsx`: Recharts-based visualization components
  - `TestResultsTable.jsx`: Sortable table of test results

### Load Testing
- **Orchestrator** (`load-test.js`): Coordinates multiple Puppeteer browsers
- **Sequential Execution**: Runs tests one at a time to isolate performance
- **Automated Reporting**: Generates CSV and JSON files in `test-results/`

## Metrics Collected

### Latency Metrics
- **Average**: Mean latency across all messages
- **P50 (Median)**: 50th percentile latency
- **P95**: 95th percentile latency
- **P99**: 99th percentile latency
- **Min/Max**: Minimum and maximum observed latency

### Throughput Metrics
- **Messages per second**: Total message processing rate
- **Total messages**: Sent and received counts
- **Success rate**: Percentage of successfully delivered messages

### Connection Metrics
- **Connected clients**: Number of active DDP connections
- **Connection time**: Time to establish connection
- **Subscription ready time**: Time until subscription is ready

## Configuration

Edit `config/testConfig.js` to customize:

```javascript
{
  testDuration: 60000,           // Test duration (ms)
  clientCounts: [10, 50, 100, 500],  // Client counts to test
  messageSendInterval: 1000,     // Message frequency (ms)
  metricsCollectionInterval: 5000,   // Metrics collection frequency
  thresholds: {
    latency: { good: 50, warning: 100 },     // Latency thresholds (ms)
    throughput: { good: 10, warning: 5 }     // Throughput thresholds (msg/s)
  }
}
```

## File Structure

```
ddp-test/
├── client/
│   ├── main.jsx          # Client entry point
│   ├── main.css          # Dashboard styles
│   └── testClient.js     # Test client implementation
├── server/
│   └── main.js           # Server entry point
├── imports/
│   ├── api/
│   │   ├── messages.js      # Message collection
│   │   └── testMetrics.js   # Test metrics & sessions
│   ├── ui/
│   │   ├── App.jsx              # App root
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   ├── MetricsCard.jsx      # Metric cards
│   │   ├── ComparisonChart.jsx  # Charts
│   │   └── TestResultsTable.jsx # Results table
│   └── utils/
│       ├── export.js     # Export utilities
│       └── metrics.js    # Metrics helpers
├── config/
│   └── testConfig.js     # Configuration
├── load-test.js          # Load test orchestrator
└── test-results/         # Generated test results (CSV, JSON)
```

## Dependencies

### Runtime
- **Meteor** 3.x
- **React** 18.x
- **Recharts** 2.x - Charts and visualizations
- **Puppeteer** 24.x - Browser automation for load testing

### Meteor Packages
- `react-meteor-data` - React integration with Meteor's reactive data

## Tips for Presentations

1. **Run tests beforehand**: Generate data by running `node load-test.js` before your presentation
2. **Full-screen mode**: Press F11 for distraction-free display
3. **Print-friendly**: The dashboard is optimized for printing (Ctrl+P)
4. **Export data**: Use export buttons to share raw data
5. **Color-coded metrics**: 
   - 🟢 Green = Good performance
   - 🟡 Orange = Warning
   - 🔴 Red = Critical

## Troubleshooting

### "Failed to initialize test session"
- Ensure the Meteor server is running
- Check that the server URL is correct in `config/testConfig.js`

### Puppeteer fails to launch browsers
```bash
# Install dependencies (Linux)
sudo apt-get install -y chromium-browser

# Or use existing Chrome
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### No data showing in dashboard
- Run load tests first: `node load-test.js`
- Check browser console for errors
- Verify MongoDB is running

## Development

### Clear all test data
```javascript
// In browser console
Meteor.call('testResults.clear')
```

### Debug test clients
Add `?test=true&session=test-123` to the URL to manually test a client

### Watch for changes
Meteor has hot-reload enabled by default. Changes to code will automatically update.

## Performance Considerations

- Each test client sends 1 message per second by default
- 500 concurrent clients = ~500 msg/s load
- Adjust `messageSendInterval` in config for different loads
- MongoDB performance impacts results
- Run tests on production-like infrastructure for accurate results

## License

MIT

## Author

Created for DDP performance analysis and research.

