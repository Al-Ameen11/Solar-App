import React from 'react';

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const stats = [
    { icon: '🌡️', value: `${weather.feelsLike?.toFixed(1)}°C`, label: 'Feels Like' },
    { icon: '💧', value: `${weather.humidity}%`, label: 'Humidity' },
    { icon: '☁️', value: `${weather.cloudCover}%`, label: 'Cloud Cover' },
    { icon: '💨', value: `${weather.windSpeed} m/s`, label: 'Wind Speed' },
    { icon: '☀️', value: weather.uvIndex ? `UV ${weather.uvIndex}` : 'N/A', label: 'UV Index' },
    { icon: '🌅', value: weather.sunrise ? formatTime(weather.sunrise) : 'N/A', label: 'Sunrise' },
  ];

  return (
    <div className="card card--weather animate-on-scroll" id="weather-card">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">🌤️</span>
          <h2 className="card__title">Current Weather</h2>
        </div>
        <span className="badge badge--amber">{weather.city}, {weather.country}</span>
      </div>

      <div className="weather-display">
        <div className="weather-display__main">
          <img
            src={iconUrl}
            alt={weather.description}
            className="weather-display__icon"
          />
          <div className="weather-display__temp">{Math.round(weather.temperature)}°</div>
          <div className="weather-display__desc">{weather.description}</div>
        </div>

        <div className="weather-display__grid">
          {stats.map((stat, i) => (
            <div className="stat-chip" key={i}>
              <span className="stat-chip__icon">{stat.icon}</span>
              <div className="stat-chip__info">
                <span className="stat-chip__value">{stat.value}</span>
                <span className="stat-chip__label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
