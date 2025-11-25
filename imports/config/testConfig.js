export const TestConfig = {
  // Test duration for each client count (in milliseconds)
  testDuration: 60000, // 60 seconds
  
  // Client count options for load testing
  clientCounts: [10, 50, 100, 500],
  
  // Message send interval (in milliseconds)
  messageSendInterval: 1000, // 1 second
  
  // Metrics collection interval (in milliseconds)
  metricsCollectionInterval: 5000, // 5 seconds
  
  // Metrics snapshot interval for clients to report to server
  clientReportInterval: 10000, // 10 seconds
  
  // Thresholds for visual indicators
  thresholds: {
    latency: {
      good: 50, // < 50ms is good (green)
      warning: 100, // 50-100ms is warning (yellow)
      // > 100ms is critical (red)
    },
    throughput: {
      good: 10, // > 10 msg/s is good
      warning: 5, // 5-10 msg/s is warning
      // < 5 msg/s is critical
    }
  },
  
  // Puppeteer launch options
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  
  // Server URL
  serverUrl: 'http://localhost:3000'
};

