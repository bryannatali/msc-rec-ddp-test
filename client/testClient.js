import { Meteor } from "meteor/meteor";
import { Messages } from "/imports/api/messages.js";
import { TestConfig } from "/imports/config/testConfig.js";

export function initializeTestClient() {
  console.log("Initializing test client mode");
  
  const clientId = `client-${Math.random().toString(36).substr(2, 9)}`;
  const connectionStartTime = Date.now();
  let subscriptionReadyTime = null;
  let sessionId = null;
  
  const clientMetrics = {
    clientId,
    connectionTime: 0,
    subscriptionReadyTime: 0,
    latencies: [],
    messagesReceived: 0,
    messagesSent: 0,
    errors: 0
  };

  // Get session ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  sessionId = urlParams.get('session');

  // Track connection time
  Meteor.connection.onReconnect = () => {
    const connectionTime = Date.now() - connectionStartTime;
    clientMetrics.connectionTime = connectionTime;
    console.log(`Client ${clientId} connected in ${connectionTime.toFixed(2)}ms`);
  };

  // Subscribe to messages and track ready time
  const subscription = Meteor.subscribe("messages", {
    onReady: () => {
      subscriptionReadyTime = Date.now();
      clientMetrics.subscriptionReadyTime = subscriptionReadyTime - connectionStartTime;
      console.log(`Client ${clientId} subscription ready in ${clientMetrics.subscriptionReadyTime.toFixed(2)}ms`);
    },
    onError: (error) => {
      console.error(`Client ${clientId} subscription error:`, error);
      clientMetrics.errors++;
    }
  });

  // Observe messages for latency tracking
  Messages.find().observeChanges({
    added(id, fields) {
      if (!fields.sentAt) return;
      
      const now = Date.now(); // Use Date.now() for absolute timestamp
      const latency = now - fields.sentAt;
      
      clientMetrics.latencies.push(latency);
      clientMetrics.messagesReceived++;
      
      // Keep only last 1000 latencies to prevent memory issues
      if (clientMetrics.latencies.length > 1000) {
        clientMetrics.latencies.shift();
      }
    }
  });

  // Send periodic messages
  const messageSendInterval = Meteor.setInterval(() => {
    try {
      Meteor.call("sendMessage", {
        content: `test-${clientId}`,
        sentAt: Date.now(), // Use Date.now() for absolute timestamp
        clientId: clientId
      }, (error) => {
        if (error) {
          console.error(`Client ${clientId} error sending message:`, error);
          clientMetrics.errors++;
        } else {
          clientMetrics.messagesSent++;
        }
      });
    } catch (error) {
      console.error(`Client ${clientId} exception:`, error);
      clientMetrics.errors++;
    }
  }, TestConfig.messageSendInterval);

  // Report metrics to server periodically
  const reportInterval = Meteor.setInterval(() => {
    if (!sessionId) return;

    // Send only aggregated metrics, not raw arrays
    const metrics = {
      clientId,
      connectionTime: clientMetrics.connectionTime,
      subscriptionReadyTime: clientMetrics.subscriptionReadyTime,
      messagesReceived: clientMetrics.messagesReceived,
      messagesSent: clientMetrics.messagesSent,
      errors: clientMetrics.errors,
      latency: {
        avg: mean(clientMetrics.latencies),
        p95: percentile(clientMetrics.latencies, 95),
        p99: percentile(clientMetrics.latencies, 99),
        min: clientMetrics.latencies.length > 0 ? Math.min(...clientMetrics.latencies) : 0,
        max: clientMetrics.latencies.length > 0 ? Math.max(...clientMetrics.latencies) : 0
      }
      // Don't send raw latencies array to avoid data size issues
    };

    Meteor.call("testSession.reportClientMetrics", sessionId, clientId, metrics, (error) => {
      if (error) {
        console.error(`Client ${clientId} error reporting metrics:`, error);
      }
    });
  }, TestConfig.clientReportInterval);

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    Meteor.clearInterval(messageSendInterval);
    Meteor.clearInterval(reportInterval);
    subscription.stop();
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

  console.log(`Test client ${clientId} initialized for session ${sessionId}`);
  
  return {
    clientId,
    getMetrics: () => clientMetrics
  };
}

