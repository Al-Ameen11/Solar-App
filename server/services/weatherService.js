const axios = require('axios');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetch current weather data for a city
 */
const getCurrentWeather = async (city) => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    return {
      city: data.name,
      country: data.sys.country,
      latitude: data.coord.lat,
      longitude: data.coord.lon,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      cloudCover: data.clouds.all,
      windSpeed: data.wind.speed,
      visibility: data.visibility,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`City "${city}" not found. Please check the city name.`);
    }
    if (error.response && error.response.status === 401) {
      throw new Error('Invalid OpenWeather API key. Please check your configuration.');
    }
    throw new Error(`Weather service error: ${error.message}`);
  }
};

/**
 * Fetch 5-day / 3-hour forecast and aggregate to daily
 */
const getForecast = async (city) => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;
    const dailyMap = {};

    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          temperatures: [],
          humidities: [],
          cloudCovers: [],
          windSpeeds: [],
          descriptions: []
        };
      }
      dailyMap[date].temperatures.push(item.main.temp);
      dailyMap[date].humidities.push(item.main.humidity);
      dailyMap[date].cloudCovers.push(item.clouds.all);
      dailyMap[date].windSpeeds.push(item.wind.speed);
      dailyMap[date].descriptions.push(item.weather[0].description);
    });

    return Object.values(dailyMap).map(day => ({
      date: day.date,
      avgTemp: +(day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length).toFixed(1),
      maxTemp: +Math.max(...day.temperatures).toFixed(1),
      minTemp: +Math.min(...day.temperatures).toFixed(1),
      avgHumidity: +(day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length).toFixed(0),
      avgCloudCover: +(day.cloudCovers.reduce((a, b) => a + b, 0) / day.cloudCovers.length).toFixed(0),
      avgWindSpeed: +(day.windSpeeds.reduce((a, b) => a + b, 0) / day.windSpeeds.length).toFixed(1),
      description: mostFrequent(day.descriptions)
    })).slice(0, 7);
  } catch (error) {
    throw new Error(`Forecast service error: ${error.message}`);
  }
};

/**
 * Get UV index for coordinates
 */
const getUVIndex = async (lat, lon) => {
  try {
    // Use OneCall-style UV from current weather data approximation
    // OpenWeather free tier doesn't always include UV, so we estimate it
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'metric'
      }
    });
    
    // Estimate UV index based on cloud cover and latitude
    const cloudCover = response.data.clouds.all;
    const latitude = Math.abs(lat);
    
    // Base UV estimation (higher near equator, lower near poles)
    let baseUV = 10 - (latitude / 10);
    baseUV = Math.max(1, Math.min(11, baseUV));
    
    // Adjust for cloud cover
    const uvIndex = baseUV * (1 - cloudCover / 100 * 0.75);
    
    return +uvIndex.toFixed(1);
  } catch (error) {
    return 5.0; // Default moderate UV
  }
};

function mostFrequent(arr) {
  const freq = {};
  arr.forEach(item => freq[item] = (freq[item] || 0) + 1);
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

module.exports = { getCurrentWeather, getForecast, getUVIndex };
