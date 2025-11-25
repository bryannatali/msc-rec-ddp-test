import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const ComparisonChart = ({ data, type = 'bar', title, dataKeys, colors }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  const defaultColors = ['#4a9eff', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

  const renderChart = () => {
    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="name" 
              stroke="#999"
              tick={{ fill: '#999' }}
            />
            <YAxis 
              stroke="#999"
              tick={{ fill: '#999' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line
                key={key.dataKey}
                type="monotone"
                dataKey={key.dataKey}
                name={key.name}
                stroke={colors?.[index] || defaultColors[index % defaultColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Bar chart (default)
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="name" 
            stroke="#999"
            tick={{ fill: '#999' }}
          />
          <YAxis 
            stroke="#999"
            tick={{ fill: '#999' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1a1a', 
              border: '1px solid #333',
              borderRadius: '4px'
            }}
          />
          <Legend />
          {dataKeys.map((key, index) => (
            <Bar
              key={key.dataKey}
              dataKey={key.dataKey}
              name={key.name}
              fill={colors?.[index] || defaultColors[index % defaultColors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      {renderChart()}
    </div>
  );
};

