import React, { useEffect, useState } from 'react';

export default function EnergyGauge({ prediction, panelCapacity = 5 }) {
  if (!prediction) return null;

  const maxDaily = prediction.peakHours * panelCapacity;
  const percentage = Math.min(100, (prediction.dailyOutput / (maxDaily || 1)) * 100);

  // Animated count-up
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const target = prediction.dailyOutput;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(parseFloat(current.toFixed(1)));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [prediction.dailyOutput]);

  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct) => {
    if (pct >= 70) return '#22C55E';
    if (pct >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const color = getColor(percentage);

  const stats = [
    { value: `${prediction.monthlyOutput}`, unit: 'kWh', label: 'Monthly' },
    { value: `${prediction.efficiency}%`, unit: '', label: 'Efficiency' },
    { value: `${prediction.peakHours}h`, unit: '', label: 'Peak Hours' },
  ];

  return (
    <div className="card card--gauge animate-on-scroll" id="energy-gauge">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">⚡</span>
          <h2 className="card__title">Energy Output</h2>
        </div>
        <span className="badge badge--green">
          <span className="badge__dot badge__dot--live" /> Live
        </span>
      </div>

      <div className="gauge">
        <div className="gauge__ring">
          <svg width="190" height="190" viewBox="0 0 190 190">
            <defs>
              <filter id="gaugeShadow">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={color} floodOpacity="0.3" />
              </filter>
            </defs>
            <circle
              className="gauge__bg"
              cx="95" cy="95" r={radius}
              fill="none"
              strokeWidth="10"
            />
            <circle
              className="gauge__fill"
              cx="95" cy="95" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              filter="url(#gaugeShadow)"
            />
          </svg>
          <div className="gauge__center">
            <div className="gauge__value" style={{ color }}>{displayValue}</div>
            <div className="gauge__unit">kWh/day</div>
          </div>
        </div>

        <div className="gauge__stats">
          {stats.map((s, i) => (
            <div className="gauge__stat" key={i}>
              <div className="gauge__stat-value">{s.value}{s.unit}</div>
              <div className="gauge__stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
