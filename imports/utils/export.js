// Export utilities for test results

export function exportToCSV(results, filename = 'ddp-test-results.csv') {
  if (!results || results.length === 0) {
    console.warn("No results to export");
    return;
  }

  // CSV Header
  const headers = [
    "Client Count",
    "Connected Clients",
    "Duration (s)",
    "Messages Sent",
    "Messages Received",
    "Success Rate (%)",
    "Throughput (msg/s)",
    "Avg Latency (ms)",
    "P50 Latency (ms)",
    "P95 Latency (ms)",
    "P99 Latency (ms)",
    "Min Latency (ms)",
    "Max Latency (ms)",
    "Timestamp"
  ];

  // CSV Rows
  const rows = results.map(result => [
    result.clientCount,
    result.metrics.connectedClients,
    result.metrics.duration.toFixed(2),
    result.metrics.messagesSent,
    result.metrics.messagesReceived,
    result.metrics.successRate.toFixed(2),
    result.metrics.throughput.toFixed(2),
    result.metrics.latency.avg.toFixed(2),
    result.metrics.latency.p50.toFixed(2),
    result.metrics.latency.p95.toFixed(2),
    result.metrics.latency.p99.toFixed(2),
    result.metrics.latency.min.toFixed(2),
    result.metrics.latency.max.toFixed(2),
    new Date(result.timestamp).toISOString()
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Download
  downloadFile(csvContent, filename, 'text/csv');
}

export function exportToJSON(results, filename = 'ddp-test-results.json') {
  if (!results || results.length === 0) {
    console.warn("No results to export");
    return;
  }

  const jsonContent = JSON.stringify({
    exportDate: new Date().toISOString(),
    resultCount: results.length,
    results: results
  }, null, 2);

  downloadFile(jsonContent, filename, 'application/json');
}

export function exportSummaryReport(results, filename = 'ddp-test-summary.txt') {
  if (!results || results.length === 0) {
    console.warn("No results to export");
    return;
  }

  const lines = [];
  
  lines.push("=".repeat(70));
  lines.push("DDP PERFORMANCE TEST SUMMARY REPORT");
  lines.push("=".repeat(70));
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total Tests: ${results.length}`);
  lines.push("");
  lines.push("=".repeat(70));
  lines.push("");

  results.forEach((result, index) => {
    const m = result.metrics;
    
    lines.push(`Test ${index + 1}: ${result.clientCount} Clients`);
    lines.push("-".repeat(70));
    lines.push(`Timestamp:          ${new Date(result.timestamp).toLocaleString()}`);
    lines.push(`Connected Clients:  ${m.connectedClients}`);
    lines.push(`Duration:           ${m.duration.toFixed(2)}s`);
    lines.push(`Messages Sent:      ${m.messagesSent}`);
    lines.push(`Messages Received:  ${m.messagesReceived}`);
    lines.push(`Success Rate:       ${m.successRate.toFixed(2)}%`);
    lines.push(`Throughput:         ${m.throughput.toFixed(2)} msg/s`);
    lines.push("");
    lines.push("Latency Metrics:");
    lines.push(`  Average:          ${m.latency.avg.toFixed(2)}ms`);
    lines.push(`  Median (P50):     ${m.latency.p50.toFixed(2)}ms`);
    lines.push(`  P95:              ${m.latency.p95.toFixed(2)}ms`);
    lines.push(`  P99:              ${m.latency.p99.toFixed(2)}ms`);
    lines.push(`  Min:              ${m.latency.min.toFixed(2)}ms`);
    lines.push(`  Max:              ${m.latency.max.toFixed(2)}ms`);
    lines.push("");
    lines.push("=".repeat(70));
    lines.push("");
  });

  // Comparison table
  if (results.length > 1) {
    lines.push("COMPARISON TABLE");
    lines.push("-".repeat(70));
    lines.push(
      "Clients".padEnd(10) + " | " +
      "Throughput".padEnd(15) + " | " +
      "Avg Latency".padEnd(15) + " | " +
      "P95 Latency".padEnd(15)
    );
    lines.push("-".repeat(70));
    
    results.forEach(result => {
      const m = result.metrics;
      lines.push(
        result.clientCount.toString().padEnd(10) + " | " +
        `${m.throughput.toFixed(2)} msg/s`.padEnd(15) + " | " +
        `${m.latency.avg.toFixed(2)} ms`.padEnd(15) + " | " +
        `${m.latency.p95.toFixed(2)} ms`.padEnd(15)
      );
    });
    lines.push("=".repeat(70));
  }

  const reportContent = lines.join('\n');
  downloadFile(reportContent, filename, 'text/plain');
}

// Helper function to trigger file download
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// Format metrics for display
export function formatMetric(value, unit = '', decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}${unit}`;
}

export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

export function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

