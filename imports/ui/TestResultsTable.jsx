import React, { useState } from 'react';
import { formatTimestamp } from '/imports/utils/export.js';

export const TestResultsTable = ({ results }) => {
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  if (!results || results.length === 0) {
    return (
      <div className="table-container">
        <h3>Test Results</h3>
        <p className="table-empty">No test results available. Run load tests to see data here.</p>
      </div>
    );
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const getValue = (result, key) => {
    switch (key) {
      case 'clientCount':
        return result.clientCount;
      case 'timestamp':
        return new Date(result.timestamp).getTime();
      case 'throughput':
        return result.metrics.throughput;
      case 'avgLatency':
        return result.metrics.latency.avg;
      case 'p95':
        return result.metrics.latency.p95;
      case 'p99':
        return result.metrics.latency.p99;
      case 'successRate':
        return result.metrics.successRate;
      case 'messagesReceived':
        return result.metrics.messagesReceived;
      default:
        return 0;
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const aVal = getValue(a, sortKey);
    const bVal = getValue(b, sortKey);
    
    if (sortDirection === 'asc') {
      return aVal - bVal;
    }
    return bVal - aVal;
  });

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <span className="sort-icon">⇅</span>;
    return <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="table-container">
      <h3>Test Results History</h3>
      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')}>
                Timestamp <SortIcon columnKey="timestamp" />
              </th>
              <th onClick={() => handleSort('clientCount')}>
                Clients <SortIcon columnKey="clientCount" />
              </th>
              <th onClick={() => handleSort('throughput')}>
                Throughput (msg/s) <SortIcon columnKey="throughput" />
              </th>
              <th onClick={() => handleSort('avgLatency')}>
                Avg Latency (ms) <SortIcon columnKey="avgLatency" />
              </th>
              <th onClick={() => handleSort('p95')}>
                P95 (ms) <SortIcon columnKey="p95" />
              </th>
              <th onClick={() => handleSort('p99')}>
                P99 (ms) <SortIcon columnKey="p99" />
              </th>
              <th onClick={() => handleSort('successRate')}>
                Success Rate <SortIcon columnKey="successRate" />
              </th>
              <th onClick={() => handleSort('messagesReceived')}>
                Messages <SortIcon columnKey="messagesReceived" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => (
              <tr key={result._id || index}>
                <td>{formatTimestamp(result.timestamp)}</td>
                <td className="text-center">{result.clientCount}</td>
                <td className="text-right">{result.metrics.throughput.toFixed(2)}</td>
                <td className="text-right">{result.metrics.latency.avg.toFixed(2)}</td>
                <td className="text-right">{result.metrics.latency.p95.toFixed(2)}</td>
                <td className="text-right">{result.metrics.latency.p99.toFixed(2)}</td>
                <td className="text-right">{result.metrics.successRate.toFixed(2)}%</td>
                <td className="text-right">{result.metrics.messagesReceived}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

