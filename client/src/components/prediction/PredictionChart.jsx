import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Area,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip__title">{data?.dayLabel || label}</p>
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: '#F59E0B' }} />
          Output: <strong>{data?.output?.toFixed(2)} kWh</strong>
        </div>
        <div className="chart-tooltip__row chart-tooltip__row--muted">
          🌡️ {data?.temperature}°C &nbsp; ☁️ {data?.cloudCover}% &nbsp; ☀️ {data?.peakHours}h
        </div>
      </div>
    );
  }
  return null;
};

export default function PredictionChart({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="card animate-on-scroll" id="prediction-chart">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">📊</span>
          <h2 className="card__title">Solar Energy Forecast</h2>
        </div>
        <span className="badge badge--amber">{forecast.length}-Day</span>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={forecast}
            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="barGradientNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="areaGradientNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="dayLabel"
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'kWh',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#64748B', fontSize: 11 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: '°C',
                angle: 90,
                position: 'insideRight',
                style: { fill: '#64748B', fontSize: 11 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="output"
              fill="url(#barGradientNew)"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="temperature"
              stroke="#3B82F6"
              fill="url(#areaGradientNew)"
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="peakHours"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ r: 4, fill: '#22C55E' }}
              strokeDasharray="5 5"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <div className="chart-legend__item">
          <span className="chart-legend__color" style={{ background: 'linear-gradient(180deg, #F59E0B, #F97316)', borderRadius: 3 }} />
          Energy (kWh)
        </div>
        <div className="chart-legend__item">
          <span className="chart-legend__color chart-legend__color--line" style={{ background: '#3B82F6' }} />
          Temperature (°C)
        </div>
        <div className="chart-legend__item">
          <span className="chart-legend__color chart-legend__color--line" style={{ background: '#22C55E', borderStyle: 'dashed' }} />
          Peak Hours
        </div>
      </div>
    </div>
  );
}
