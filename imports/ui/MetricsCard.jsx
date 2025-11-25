import React from 'react';
import { TestConfig } from '/imports/config/testConfig.js';

export const MetricsCard = ({ title, value, unit, subtitle, trend, type = 'latency' }) => {
  // Determine status color based on thresholds
  const getStatusColor = () => {
    if (!value || typeof value !== 'number') return '#888';
    
    const thresholds = TestConfig.thresholds[type];
    if (!thresholds) return '#4a9eff';

    if (type === 'latency') {
      if (value < thresholds.good) return '#4caf50'; // green
      if (value < thresholds.warning) return '#ff9800'; // orange
      return '#f44336'; // red
    } else if (type === 'throughput') {
      if (value > thresholds.good) return '#4caf50';
      if (value > thresholds.warning) return '#ff9800';
      return '#f44336';
    }
    
    return '#4a9eff'; // default blue
  };

  const statusColor = getStatusColor();

  const formatValue = (val) => {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) {
      return 'N/A';
    }
    if (typeof val === 'number') {
      return val.toFixed(2);
    }
    return val.toString();
  };

  return (
    <div className="metrics-card">
      <div className="metrics-card-header">
        <h3>{title}</h3>
        {trend && <span className={`trend ${trend > 0 ? 'up' : 'down'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </span>}
      </div>
      <div className="metrics-card-value" style={{ color: statusColor }}>
        {formatValue(value)}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {subtitle && <div className="metrics-card-subtitle">{subtitle}</div>}
    </div>
  );
};

