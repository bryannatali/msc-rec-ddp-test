import { Meteor } from "meteor/meteor";
import { WebApp } from "meteor/webapp";
import { Messages } from "/imports/api/messages.js";
import "/imports/api/testMetrics.js"; // Import to register methods
import { getCurrentTestSession } from "/imports/api/testMetrics.js";

Meteor.publish("messages", function () {
  return Messages.find();
});

Meteor.methods({
  sendMessage(payload) {
    // Record message sent if we're in a test session
    const currentSession = getCurrentTestSession();
    if (currentSession) {
      Meteor.call("testSession.recordMessageSent", currentSession);
    }
    return Messages.insertAsync(payload);
  }
});

// HTTP API for load test script
WebApp.connectHandlers.use("/api/test", (req, res, next) => {
  if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        const { method, params } = JSON.parse(body);
        
        // Call the Meteor method using Meteor.callAsync (wrapped in a Promise)
        const result = await new Promise((resolve, reject) => {
          Meteor.call(method, ...params, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ result }));
      } catch (error) {
        console.error("API Error:", error);
        res.writeHead(error.error ? 500 : 400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message || error.reason || String(error) }));
      }
    });
  } else {
    next();
  }
});

// Observe message changes for metrics collection
Meteor.startup(() => {
  console.log("Server started - initializing DDP metrics observer");
  
  Messages.find().observeChanges({
    added(id, fields) {
      if (!fields.sentAt) return;
      
      const now = Date.now(); // Use Date.now() for absolute timestamp
      const latency = now - fields.sentAt;
      
      // Record latency for current test session
      const currentSession = getCurrentTestSession();
      if (currentSession) {
        Meteor.call("testSession.recordLatency", currentSession, latency);
      }
    }
  });

  // Log server info
  console.log("DDP Performance Test Server Ready");
  console.log("Connect clients to http://localhost:3000?test=true");
  console.log("API endpoint available at http://localhost:3000/api/test");
});
