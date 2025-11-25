import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";

export const TestResults = new Mongo.Collection("testResults");
export const TestSessions = new Mongo.Collection("testSessions");

// Current active session for tracking real-time metrics (server-only)
let activeSession = null;
let sessionMetrics = {
  latencies: [],
  messagesReceived: 0,
  messagesSent: 0,
  connectedClients: new Set(),
  startTime: null,
  clientMetrics: new Map(), // clientId -> metrics
};

// Export function to get current session
export function getCurrentTestSession() {
  if (Meteor.isServer) {
    return activeSession;
  }
  return null;
}

if (Meteor.isServer) {
  Meteor.methods({
    // Initialize a new test session
    async "testSession.start"(clientCount) {
      console.log(`Starting test session with ${clientCount} clients`);

      const sessionId = await TestSessions.insertAsync({
        clientCount,
        status: "running",
        startTime: new Date(),
        endTime: null,
        metrics: {
          latencies: [],
          throughput: 0,
          messagesReceived: 0,
          messagesSent: 0,
          connectedClients: 0,
        },
      });

      // Reset session metrics
      activeSession = sessionId;
      sessionMetrics = {
        latencies: [],
        messagesReceived: 0,
        messagesSent: 0,
        connectedClients: new Set(),
        startTime: Date.now(),
        clientMetrics: new Map(),
      };

      console.log(`Test session ${sessionId} started successfully`);
      return sessionId;
    },

    // Record a latency measurement from server observation
    "testSession.recordLatency"(sessionId, latency) {
      if (activeSession === sessionId) {
        sessionMetrics.latencies.push(latency);
        sessionMetrics.messagesReceived++;
      }
    },

    // Record metrics from a client
    "testSession.reportClientMetrics"(sessionId, clientId, metrics) {
      if (activeSession === sessionId) {
        sessionMetrics.connectedClients.add(clientId);
        sessionMetrics.clientMetrics.set(clientId, {
          ...metrics,
          lastReport: Date.now(),
        });
      }
    },

    // Record message sent
    "testSession.recordMessageSent"(sessionId) {
      if (activeSession === sessionId) {
        sessionMetrics.messagesSent++;
      }
    },

    // Get current session metrics (for real-time display)
    "testSession.getCurrentMetrics"() {
      if (!activeSession) return null;

      const elapsed = (Date.now() - sessionMetrics.startTime) / 1000;
      const latencies = sessionMetrics.latencies;

      return {
        sessionId: activeSession,
        connectedClients: sessionMetrics.connectedClients.size,
        messagesReceived: sessionMetrics.messagesReceived,
        messagesSent: sessionMetrics.messagesSent,
        throughput: elapsed > 0 ? sessionMetrics.messagesReceived / elapsed : 0,
        latency: {
          avg: mean(latencies),
          p50: percentile(latencies, 50),
          p95: percentile(latencies, 95),
          p99: percentile(latencies, 99),
          min: latencies.length > 0 ? Math.min(...latencies) : 0,
          max: latencies.length > 0 ? Math.max(...latencies) : 0,
        },
        elapsed: elapsed,
        clientMetrics: Array.from(sessionMetrics.clientMetrics.entries()).map(
          ([id, metrics]) => ({
            clientId: id,
            ...metrics,
          })
        ),
      };
    },

    // Finalize a test session
    async "testSession.finalize"(sessionId) {
      console.log(`Finalizing test session ${sessionId}`);

      if (activeSession !== sessionId) {
        throw new Meteor.Error("invalid-session", "Not the active session");
      }

      const elapsed = (Date.now() - sessionMetrics.startTime) / 1000;
      const latencies = sessionMetrics.latencies;

      const finalMetrics = {
        connectedClients: sessionMetrics.connectedClients.size,
        messagesReceived: sessionMetrics.messagesReceived,
        messagesSent: sessionMetrics.messagesSent,
        throughput: elapsed > 0 ? sessionMetrics.messagesReceived / elapsed : 0,
        latency: {
          avg: mean(latencies),
          p50: percentile(latencies, 50),
          p95: percentile(latencies, 95),
          p99: percentile(latencies, 99),
          min: latencies.length > 0 ? Math.min(...latencies) : 0,
          max: latencies.length > 0 ? Math.max(...latencies) : 0,
        },
        duration: elapsed,
        successRate:
          sessionMetrics.messagesSent > 0
            ? (sessionMetrics.messagesReceived / sessionMetrics.messagesSent) *
              100
            : 0,
      };

      try {
        // Get the session to retrieve client count
        const session = await TestSessions.findOneAsync(sessionId);
        if (!session) {
          throw new Meteor.Error(
            "session-not-found",
            `Session ${sessionId} not found`
          );
        }

        // Update session
        await TestSessions.updateAsync(sessionId, {
          $set: {
            status: "completed",
            endTime: new Date(),
            metrics: finalMetrics,
          },
        });

        // Store detailed results (limit data to avoid MongoDB 16MB limit)
        await TestResults.insertAsync({
          sessionId,
          timestamp: new Date(),
          clientCount: session.clientCount,
          metrics: finalMetrics,
          rawData: {
            latencies: latencies.slice(0, 1000), // Store up to 1000 samples
            clientMetrics: Array.from(sessionMetrics.clientMetrics.entries())
              .slice(0, 100) // Limit to 100 clients max
              .map(([id, metrics]) => ({
                clientId: id,
                connectionTime: metrics.connectionTime,
                subscriptionReadyTime: metrics.subscriptionReadyTime,
                messagesReceived: metrics.messagesReceived,
                messagesSent: metrics.messagesSent,
                errors: metrics.errors,
                latency: metrics.latency, // Aggregated stats only
                // Don't store raw latencies array to avoid document size issues
              })),
          },
        });

        console.log(`Test session ${sessionId} finalized successfully`);
        console.log(
          `  - Messages: ${finalMetrics.messagesReceived}/${finalMetrics.messagesSent}`
        );
        console.log(
          `  - Throughput: ${finalMetrics.throughput.toFixed(2)} msg/s`
        );
        console.log(
          `  - Avg Latency: ${finalMetrics.latency.avg.toFixed(2)}ms`
        );
      } catch (error) {
        console.error(`Error finalizing session ${sessionId}:`, error);
        throw error;
      }

      // Clear active session
      activeSession = null;

      return finalMetrics;
    },

    // Get all test results
    "testResults.getAll"() {
      return TestResults.find({}, { sort: { timestamp: -1 } }).fetch();
    },

    // Get test results grouped by client count (latest for each)
    "testResults.getLatestByClientCount"() {
      const allResults = TestResults.find(
        {},
        { sort: { timestamp: -1 } }
      ).fetch();
      const byClientCount = new Map();

      for (const result of allResults) {
        if (!byClientCount.has(result.clientCount)) {
          byClientCount.set(result.clientCount, result);
        }
      }

      return Array.from(byClientCount.values()).sort(
        (a, b) => a.clientCount - b.clientCount
      );
    },

    // Clear all test results (for cleanup)
    "testResults.clear"() {
      TestResults.removeAsync({});
      TestSessions.removeAsync({});
    },
  });

  // Publish test sessions
  Meteor.publish("testSessions", function () {
    return TestSessions.find({});
  });

  // Publish test results
  Meteor.publish("testResults", function () {
    return TestResults.find({}, { sort: { timestamp: -1 }, limit: 100 });
  });

  // Helper functions
  function mean(values) {
    if (!values.length) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  function percentile(values, p) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}
