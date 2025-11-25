import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { TestResults, TestSessions } from '/imports/api/testMetrics.js';
import { MetricsCard } from './MetricsCard.jsx';
import { ComparisonChart } from './ComparisonChart.jsx';
import { TestResultsTable } from './TestResultsTable.jsx';
import { exportToCSV, exportToJSON, exportSummaryReport } from '/imports/utils/export.js';

export const Dashboard = () => {
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [showRealTime, setShowRealTime] = useState(false);

  // Subscribe to test data
  const { testResults, activeSessions, isLoading } = useTracker(() => {
    const resultsSub = Meteor.subscribe('testResults');
    const sessionsSub = Meteor.subscribe('testSessions');
    
    return {
      testResults: TestResults.find({}, { sort: { timestamp: -1 } }).fetch(),
      activeSessions: TestSessions.find({ status: 'running' }).fetch(),
      isLoading: !resultsSub.ready() || !sessionsSub.ready()
    };
  }, []);

  // Poll for current metrics if there's an active session
  useEffect(() => {
    if (activeSessions && activeSessions.length > 0) {
      setShowRealTime(true);
      
      const interval = setInterval(() => {
        Meteor.call('testSession.getCurrentMetrics', (error, result) => {
          if (!error && result) {
            setCurrentMetrics(result);
          }
        });
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    } else {
      setShowRealTime(false);
      setCurrentMetrics(null);
    }
  }, [activeSessions]);

  // Get latest results grouped by client count
  const getLatestByClientCount = () => {
    const byClientCount = new Map();
    
    testResults.forEach(result => {
      if (!byClientCount.has(result.clientCount) || 
          new Date(result.timestamp) > new Date(byClientCount.get(result.clientCount).timestamp)) {
        byClientCount.set(result.clientCount, result);
      }
    });

    return Array.from(byClientCount.values()).sort((a, b) => a.clientCount - b.clientCount);
  };

  const latestResults = getLatestByClientCount();

  // Prepare data for charts
  const prepareLatencyChartData = () => {
    return latestResults.map(result => ({
      name: `${result.clientCount} clients`,
      'Avg': result.metrics.latency.avg,
      'P95': result.metrics.latency.p95,
      'P99': result.metrics.latency.p99
    }));
  };

  const prepareThroughputChartData = () => {
    return latestResults.map(result => ({
      name: `${result.clientCount} clients`,
      'Throughput': result.metrics.throughput
    }));
  };

  const prepareSuccessRateChartData = () => {
    return latestResults.map(result => ({
      name: `${result.clientCount} clients`,
      'Success Rate': result.metrics.successRate
    }));
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(testResults, `ddp-test-results-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportJSON = () => {
    exportToJSON(testResults, `ddp-test-results-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleExportSummary = () => {
    exportSummaryReport(latestResults, `ddp-test-summary-${new Date().toISOString().split('T')[0]}.txt`);
  };

  const handleClearResults = () => {
    if (confirm('Are you sure you want to clear all test results? This cannot be undone.')) {
      Meteor.call('testResults.clear', (error) => {
        if (error) {
          alert('Error clearing results: ' + error.message);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚀 DDP Performance Dashboard</h1>
          <p className="subtitle">Meteor.js DDP Protocol Performance Analysis</p>
        </div>
        
        {showRealTime && (
          <div className="status-indicator active">
            <span className="status-dot"></span>
            Test Running
          </div>
        )}
      </header>

      {/* Real-time Section */}
      {showRealTime && currentMetrics && (
        <section className="real-time-section">
          <h2>📊 Real-Time Metrics</h2>
          <div className="metrics-grid">
            <MetricsCard
              title="Connected Clients"
              value={currentMetrics.connectedClients}
              subtitle={`Expected: ${activeSessions[0]?.clientCount || 0}`}
            />
            <MetricsCard
              title="Throughput"
              value={currentMetrics.throughput}
              unit=" msg/s"
              type="throughput"
              subtitle={`${currentMetrics.messagesReceived} messages received`}
            />
            <MetricsCard
              title="Average Latency"
              value={currentMetrics.latency.avg}
              unit="ms"
              type="latency"
              subtitle={`P95: ${currentMetrics.latency.p95.toFixed(2)}ms`}
            />
            <MetricsCard
              title="P99 Latency"
              value={currentMetrics.latency.p99}
              unit="ms"
              type="latency"
              subtitle={`Max: ${currentMetrics.latency.max.toFixed(2)}ms`}
            />
          </div>
          <div className="real-time-info">
            ⏱️ Test duration: {currentMetrics.elapsed.toFixed(0)}s
          </div>
        </section>
      )}

      {/* Historical Comparison Section */}
      <section className="comparison-section">
        <div className="section-header">
          <h2>📈 Performance Comparison</h2>
          <div className="export-controls">
            <button onClick={handleExportCSV} className="btn btn-export">
              📄 Export CSV
            </button>
            <button onClick={handleExportJSON} className="btn btn-export">
              📋 Export JSON
            </button>
            <button onClick={handleExportSummary} className="btn btn-export">
              📊 Summary Report
            </button>
            <button onClick={handleClearResults} className="btn btn-danger">
              🗑️ Clear All
            </button>
          </div>
        </div>

        {latestResults.length === 0 ? (
          <div className="no-data">
            <h3>No Test Results Yet</h3>
            <p>Run load tests using:</p>
            <code>node load-test.js</code>
            <p className="help-text">
              The load test script will simulate multiple clients and collect performance metrics.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="summary-grid">
              {latestResults.map(result => (
                <div key={result._id} className="summary-card">
                  <div className="summary-card-header">
                    <h3>{result.clientCount} Clients</h3>
                    <span className="timestamp">
                      {new Date(result.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="summary-stats">
                    <div className="stat">
                      <span className="stat-label">Throughput</span>
                      <span className="stat-value">
                        {result.metrics.throughput.toFixed(2)} msg/s
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Avg Latency</span>
                      <span className="stat-value">
                        {result.metrics.latency.avg.toFixed(2)}ms
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">P95</span>
                      <span className="stat-value">
                        {result.metrics.latency.p95.toFixed(2)}ms
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Success Rate</span>
                      <span className="stat-value">
                        {result.metrics.successRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <ComparisonChart
                data={prepareLatencyChartData()}
                type="bar"
                title="Latency Comparison"
                dataKeys={[
                  { dataKey: 'Avg', name: 'Average' },
                  { dataKey: 'P95', name: 'P95' },
                  { dataKey: 'P99', name: 'P99' }
                ]}
                colors={['#4a9eff', '#ff9800', '#f44336']}
              />
              
              <ComparisonChart
                data={prepareThroughputChartData()}
                type="line"
                title="Throughput Scaling"
                dataKeys={[
                  { dataKey: 'Throughput', name: 'Messages/sec' }
                ]}
                colors={['#4caf50']}
              />

              <ComparisonChart
                data={prepareSuccessRateChartData()}
                type="bar"
                title="Message Delivery Success Rate"
                dataKeys={[
                  { dataKey: 'Success Rate', name: 'Success %' }
                ]}
                colors={['#9c27b0']}
              />
            </div>

            {/* Detailed Results Table */}
            <TestResultsTable results={testResults} />
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>DDP Performance Testing Suite | Meteor.js</p>
        <p className="help-text">
          Run tests: <code>node load-test.js</code> | 
          View docs: <code>node load-test.js --help</code>
        </p>
      </footer>
    </div>
  );
};

