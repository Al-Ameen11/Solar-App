/**
 * Tests for predictionService.js
 * Tests the physics-based solar energy prediction model
 */
const { predictSolarEnergy, predictForecast } = require('../services/predictionService');

describe('predictSolarEnergy', () => {
  const baseWeather = {
    temperature: 30,
    humidity: 50,
    cloudCover: 20,
    windSpeed: 5,
    latitude: 19 // Mumbai
  };

  test('should return prediction with all required fields', () => {
    const result = predictSolarEnergy(baseWeather, 5);
    expect(result).toHaveProperty('dailyOutput');
    expect(result).toHaveProperty('monthlyOutput');
    expect(result).toHaveProperty('yearlyOutput');
    expect(result).toHaveProperty('efficiency');
    expect(result).toHaveProperty('peakHours');
    expect(result).toHaveProperty('irradiance');
    expect(result).toHaveProperty('systemLossFactor');
  });

  test('should return positive values for sunny conditions', () => {
    const result = predictSolarEnergy(baseWeather, 5);
    expect(result.dailyOutput).toBeGreaterThan(0);
    expect(result.monthlyOutput).toBeGreaterThan(0);
    expect(result.yearlyOutput).toBeGreaterThan(0);
    expect(result.efficiency).toBeGreaterThan(0);
  });

  test('should produce higher output for larger panels', () => {
    const small = predictSolarEnergy(baseWeather, 2);
    const large = predictSolarEnergy(baseWeather, 10);
    expect(large.dailyOutput).toBeGreaterThan(small.dailyOutput);
  });

  test('should produce less output with high cloud cover', () => {
    const sunny = predictSolarEnergy({ ...baseWeather, cloudCover: 10 }, 5);
    const cloudy = predictSolarEnergy({ ...baseWeather, cloudCover: 90 }, 5);
    expect(sunny.dailyOutput).toBeGreaterThan(cloudy.dailyOutput);
  });

  test('should produce less output with high humidity', () => {
    const dry = predictSolarEnergy({ ...baseWeather, humidity: 20 }, 5);
    const humid = predictSolarEnergy({ ...baseWeather, humidity: 95 }, 5);
    expect(dry.dailyOutput).toBeGreaterThanOrEqual(humid.dailyOutput);
  });

  test('monthly output should be ~30x daily output', () => {
    const result = predictSolarEnergy(baseWeather, 5);
    expect(result.monthlyOutput).toBeCloseTo(result.dailyOutput * 30, 0);
  });

  test('efficiency should decrease at higher temperatures', () => {
    const cool = predictSolarEnergy({ ...baseWeather, temperature: 15 }, 5);
    const hot = predictSolarEnergy({ ...baseWeather, temperature: 45 }, 5);
    expect(cool.efficiency).toBeGreaterThan(hot.efficiency);
  });

  test('should handle default latitude', () => {
    const noLat = { temperature: 30, humidity: 50, cloudCover: 20, windSpeed: 5 };
    const result = predictSolarEnergy(noLat, 5);
    expect(result.dailyOutput).toBeGreaterThan(0);
  });
});

describe('predictForecast', () => {
  const forecastDays = [
    { date: '2026-03-11', avgTemp: 30, avgHumidity: 50, avgCloudCover: 20, avgWindSpeed: 5, description: 'clear sky' },
    { date: '2026-03-12', avgTemp: 28, avgHumidity: 60, avgCloudCover: 50, avgWindSpeed: 3, description: 'cloudy' },
    { date: '2026-03-13', avgTemp: 25, avgHumidity: 80, avgCloudCover: 90, avgWindSpeed: 7, description: 'rain' },
  ];

  test('should return predictions for each forecast day', () => {
    const result = predictForecast(forecastDays, 5, 19);
    expect(result).toHaveLength(3);
  });

  test('each forecast entry should have required fields', () => {
    const result = predictForecast(forecastDays, 5, 19);
    result.forEach(entry => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('dayLabel');
      expect(entry).toHaveProperty('output');
      expect(entry).toHaveProperty('temperature');
      expect(entry).toHaveProperty('cloudCover');
      expect(entry).toHaveProperty('peakHours');
      expect(entry).toHaveProperty('efficiency');
    });
  });

  test('clear day should have more output than rainy day', () => {
    const result = predictForecast(forecastDays, 5, 19);
    expect(result[0].output).toBeGreaterThan(result[2].output);
  });
});
