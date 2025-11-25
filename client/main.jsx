import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';
import { initializeTestClient } from './testClient';

Meteor.startup(() => {
  // Check if we're in test mode
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('test') === 'true';

  if (isTestMode) {
    // Initialize as test client
    console.log("Running in TEST MODE");
    initializeTestClient();
    
    // Show minimal UI for test clients
    const container = document.getElementById('react-target');
    const root = createRoot(container);
    root.render(
      <div style={{ 
        padding: '20px', 
        fontFamily: 'monospace',
        backgroundColor: '#1a1a1a',
        color: '#00ff00',
        minHeight: '100vh'
      }}>
        <h2>🧪 DDP Test Client</h2>
        <p>Client ID: {urlParams.get('session')}</p>
        <p>Status: Running...</p>
        <p style={{ color: '#888' }}>Check console for metrics</p>
      </div>
    );
  } else {
    // Normal mode - load dashboard
    console.log("Running in DASHBOARD MODE");
    const container = document.getElementById('react-target');
    const root = createRoot(container);
    root.render(<App />);
  }
});
