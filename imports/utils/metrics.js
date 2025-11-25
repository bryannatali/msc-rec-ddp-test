export function createMetricsManager() {
  let intervals = [];
  let latencies = [];
  let messagesReceived = 0;
  let windowStart = performance.now();

  const mean = arr =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const percentile = (arr, p) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor((p / 100) * sorted.length);
    return sorted[idx];
  };

  const createInterval = (fn, time) => {
    const id = Meteor.setInterval(fn, time);
    intervals.push(id);
    return id;
  };

  return {
    recordLatency(ms) {
      latencies.push(ms);
    },

    incrementMessages() {
      messagesReceived++;
    },

    start() {
      // collect snapshot each 10 seconds
      createInterval(() => {
        const now = performance.now();
        const elapsed = (now - windowStart) / 1000;

        console.log("===== MÉTRICAS =====");
        console.log("Latência média:", mean(latencies).toFixed(2), "ms");
        console.log("P95:", percentile(latencies, 95).toFixed(2), "ms");
        console.log("P99:", percentile(latencies, 99).toFixed(2), "ms");
        console.log("Throughput:", (messagesReceived / elapsed).toFixed(2), "msg/s");
        console.log("====================");

        // redefine window
        messagesReceived = 0;
        latencies = [];
        windowStart = performance.now();

      }, 10000);
    },

    stop() {
      intervals.forEach(id => clearInterval(id));
      intervals = [];
      console.log("Métricas pausadas. Intervals limpos.");
    },

    getSnapshot() {
      return {
        avg: mean(latencies),
        p95: percentile(latencies, 95),
        p99: percentile(latencies, 99),
        count: messagesReceived,
      };
    },

    exportCSV() {
      const rows = [
        ["avg", "p95", "p99", "count"],
        [mean(latencies), percentile(latencies, 95), percentile(latencies, 99), messagesReceived]
      ];

      const csv = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "metrics.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };
}
