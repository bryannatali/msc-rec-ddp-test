const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  serverUrl: "http://localhost:3000",
  testDuration: 60000, // 60 seconds
  clientCounts: [10, 50, 100, 500],
  resultsDir: "./test-results",
  puppeteerOptions: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
DDP Performance Load Test Orchestrator

Usage: node load-test.js [options]

Options:
  --clients <N>        Test with specific client count (comma-separated for multiple)
  --duration <ms>      Test duration in milliseconds (default: 60000)
  --help, -h           Show this help message

Examples:
  node load-test.js                          # Run all tests (10, 50, 100, 500)
  node load-test.js --clients 10,50          # Run only 10 and 50 clients
  node load-test.js --duration 30000         # Run with 30 second duration
  `);
  process.exit(0);
}

// Override config from CLI args
const clientsArg = args.indexOf("--clients");
if (clientsArg !== -1 && args[clientsArg + 1]) {
  CONFIG.clientCounts = args[clientsArg + 1]
    .split(",")
    .map((n) => parseInt(n.trim()));
}

const durationArg = args.indexOf("--duration");
if (durationArg !== -1 && args[durationArg + 1]) {
  CONFIG.testDuration = parseInt(args[durationArg + 1]);
}

// Ensure results directory exists
if (!fs.existsSync(CONFIG.resultsDir)) {
  fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
}

// HTTP helper to call Meteor methods via REST API
async function callMeteorMethod(method, ...params) {
  try {
    const response = await fetch(`${CONFIG.serverUrl}/api/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: method,
        params: params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling ${method}:`, error.message);
    return null;
  }
}

// Cleanup function for browsers
async function cleanupBrowser(browser, pages) {
  if (pages && pages.length > 0) {
    console.log(`Cleaning up ${pages.length} pages...`);
    for (const page of pages) {
      try {
        await page.close();
      } catch (error) {
        // Ignore close errors
      }
    }
  }

  if (browser) {
    try {
      await browser.close();
      console.log("✓ Browser closed");
    } catch (error) {
      console.error("Error closing browser:", error.message);
    }
  }
}

// Run a single test with N clients
async function runTest(clientCount) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Starting test with ${clientCount} clients`);
  console.log(`Duration: ${CONFIG.testDuration / 1000} seconds`);
  console.log(`${"=".repeat(60)}\n`);

  const startTime = Date.now();
  let sessionId = null;
  let browser = null;
  const pages = [];

  try {
    // Initialize test session on server
    console.log("Initializing test session on server...");
    const initResponse = await callMeteorMethod(
      "testSession.start",
      clientCount
    );
    sessionId = initResponse?.result;

    if (!sessionId) {
      throw new Error("Failed to initialize test session");
    }

    console.log(`Test session created: ${sessionId}`);

    // Launch browser
    console.log("Launching browser...");
    browser = await puppeteer.launch(CONFIG.puppeteerOptions);

    // Launch clients
    console.log(`Launching ${clientCount} client pages...`);
    const testUrl = `${CONFIG.serverUrl}?test=true&session=${sessionId}`;

    for (let i = 0; i < clientCount; i++) {
      try {
        const page = await browser.newPage();

        // Suppress console logs from pages (optional)
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            console.error(`Page ${i} error:`, msg.text());
          }
        });

        await page.goto(testUrl, { waitUntil: "networkidle2", timeout: 30000 });

        // Wait for Meteor to be fully loaded and connected
        await page
          .waitForFunction(
            () =>
              typeof Meteor !== "undefined" &&
              Meteor.status &&
              Meteor.status().connected,
            { timeout: 10000 }
          )
          .catch(() => {
            console.warn(`Client ${i} - Meteor connection timeout`);
          });

        pages.push(page);

        // Progress indicator
        if ((i + 1) % 10 === 0 || i === clientCount - 1) {
          process.stdout.write(`  Launched: ${i + 1}/${clientCount}\r`);
        }
      } catch (error) {
        console.error(`Failed to launch client ${i}:`, error.message);
      }
    }

    console.log(
      `\n✓ Successfully launched ${pages.length}/${clientCount} clients`
    );

    // Wait for test duration with progress updates
    console.log(`\nRunning test for ${CONFIG.testDuration / 1000} seconds...`);
    const progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.ceil(CONFIG.testDuration / 1000 - elapsed);
      process.stdout.write(`  Time remaining: ${remaining}s \r`);
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, CONFIG.testDuration));
    clearInterval(progressInterval);

    console.log("\n✓ Test duration complete");

    // Close all pages and browser
    console.log("Closing client pages...");
    await cleanupBrowser(browser, pages);
    browser = null; // Clear reference

    // Finalize test session and get results
    console.log("Finalizing test session...");
    const finalizeResponse = await callMeteorMethod(
      "testSession.finalize",
      sessionId
    );
    const results = finalizeResponse?.result;

    if (!results) {
      throw new Error("Failed to get test results");
    }

    console.log("\n" + "=".repeat(60));
    console.log("TEST RESULTS");
    console.log("=".repeat(60));
    console.log(`Clients: ${clientCount}`);
    console.log(`Connected: ${results.connectedClients}`);
    console.log(`Duration: ${results.duration.toFixed(2)}s`);
    console.log(`Messages Sent: ${results.messagesSent}`);
    console.log(`Messages Received: ${results.messagesReceived}`);
    console.log(`Success Rate: ${results.successRate.toFixed(2)}%`);
    console.log(`Throughput: ${results.throughput.toFixed(2)} msg/s`);
    console.log(`\nLatency:`);
    console.log(`  Average: ${results.latency.avg.toFixed(2)}ms`);
    console.log(`  Median (P50): ${results.latency.p50.toFixed(2)}ms`);
    console.log(`  P95: ${results.latency.p95.toFixed(2)}ms`);
    console.log(`  P99: ${results.latency.p99.toFixed(2)}ms`);
    console.log(`  Min: ${results.latency.min.toFixed(2)}ms`);
    console.log(`  Max: ${results.latency.max.toFixed(2)}ms`);
    console.log("=".repeat(60) + "\n");

    return {
      clientCount,
      sessionId,
      success: true,
      results,
    };
  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
    console.error(error.stack);

    // Cleanup browsers
    await cleanupBrowser(browser, pages);

    return {
      clientCount,
      sessionId,
      success: false,
      error: error.message,
    };
  }
}

// Main orchestrator
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("DDP PERFORMANCE LOAD TEST ORCHESTRATOR");
  console.log("=".repeat(60));
  console.log(`Server: ${CONFIG.serverUrl}`);
  console.log(`Test Duration: ${CONFIG.testDuration / 1000}s per test`);
  console.log(`Client Counts: ${CONFIG.clientCounts.join(", ")}`);
  console.log("=".repeat(60) + "\n");

  const allResults = [];
  const overallStartTime = Date.now();

  // Handle interrupts gracefully
  let isShuttingDown = false;
  const handleShutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log("\n\n⚠️  Interrupt received - cleaning up...");
    console.log("This may take a moment...");

    // Give puppeteer processes time to clean up
    setTimeout(() => {
      console.log("✓ Cleanup complete");
      process.exit(0);
    }, 2000);
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  // Run tests sequentially
  for (let i = 0; i < CONFIG.clientCounts.length; i++) {
    const clientCount = CONFIG.clientCounts[i];

    console.log(`\n[Test ${i + 1}/${CONFIG.clientCounts.length}]`);
    const result = await runTest(clientCount);
    allResults.push(result);

    // Wait a bit between tests to let server settle
    if (i < CONFIG.clientCounts.length - 1) {
      console.log("\nWaiting 5 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  const overallDuration = (Date.now() - overallStartTime) / 1000;

  // Generate summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY OF ALL TESTS");
  console.log("=".repeat(60));
  console.log(`Total Duration: ${overallDuration.toFixed(2)}s`);
  console.log(
    `Tests Completed: ${allResults.filter((r) => r.success).length}/${
      allResults.length
    }`
  );
  console.log("\nResults by Client Count:");
  console.log("-".repeat(60));

  const successfulResults = allResults.filter((r) => r.success);

  if (successfulResults.length > 0) {
    console.log(
      `${"Clients".padEnd(10)} | ` +
        `${"Throughput".padEnd(15)} | ` +
        `${"Avg Latency".padEnd(15)} | ` +
        `${"P95 Latency".padEnd(15)}`
    );
    console.log("-".repeat(60));

    for (const result of successfulResults) {
      const r = result.results;
      console.log(
        `${result.clientCount.toString().padEnd(10)} | ` +
          `${r.throughput.toFixed(2).padEnd(15)} | ` +
          `${r.latency.avg.toFixed(2).padEnd(15)} | ` +
          `${r.latency.p95.toFixed(2).padEnd(15)}`
      );
    }
  }

  console.log("=".repeat(60) + "\n");

  // Save results to files
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Save JSON
  const jsonPath = path.join(
    CONFIG.resultsDir,
    `test-results-${timestamp}.json`
  );
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        config: CONFIG,
        duration: overallDuration,
        results: allResults,
      },
      null,
      2
    )
  );
  console.log(`✓ Results saved to ${jsonPath}`);

  // Save CSV
  const csvPath = path.join(CONFIG.resultsDir, `test-results-${timestamp}.csv`);
  const csvHeader =
    "Client Count,Connected,Duration,Messages Sent,Messages Received,Success Rate,Throughput,Avg Latency,P50,P95,P99,Min,Max\n";
  const csvRows = successfulResults
    .map((result) => {
      const r = result.results;
      return [
        result.clientCount,
        r.connectedClients,
        r.duration.toFixed(2),
        r.messagesSent,
        r.messagesReceived,
        r.successRate.toFixed(2),
        r.throughput.toFixed(2),
        r.latency.avg.toFixed(2),
        r.latency.p50.toFixed(2),
        r.latency.p95.toFixed(2),
        r.latency.p99.toFixed(2),
        r.latency.min.toFixed(2),
        r.latency.max.toFixed(2),
      ].join(",");
    })
    .join("\n");

  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`✓ CSV saved to ${csvPath}`);

  console.log("\n✅ All tests complete!\n");

  // Remove shutdown handlers
  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");

  // Check for failures
  const failures = allResults.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log("⚠️  Some tests failed:");
    failures.forEach((f) => {
      console.log(`  - ${f.clientCount} clients: ${f.error}`);
    });
    process.exit(1);
  }
}

// Run the orchestrator
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
