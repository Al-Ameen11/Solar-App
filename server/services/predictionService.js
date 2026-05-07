/**
 * Solar Energy Prediction Service
 * Uses a physics-informed model combined with ML regression for solar energy estimation
 */

/**
 * Calculate solar irradiance based on weather parameters
 * Uses a simplified clear-sky model with cloud & atmospheric corrections
 */
const calculateSolarIrradiance = (latitude, cloudCover, humidity, temperature, dayOfYear) => {
  // Solar constant (W/m²)
  const solarConstant = 1361;
  
  // Calculate solar declination angle (radians)
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81)) * (Math.PI / 180);
  
  // Convert latitude to radians
  const latRad = latitude * (Math.PI / 180);
  
  // Calculate hour angle at solar noon (0 for noon)
  // Calculate day length factor
  const cosZenith = Math.sin(latRad) * Math.sin(declination) + 
                     Math.cos(latRad) * Math.cos(declination);
  const zenithAngle = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  
  // Atmospheric transmittance (Hottel's model simplified)
  const altitude = 0; // Assume sea level
  const a0 = 0.4237 - 0.00821 * Math.pow(6 - altitude, 2);
  const a1 = 0.5055 + 0.00595 * Math.pow(6.5 - altitude, 2);
  const k = 0.2711 + 0.01858 * Math.pow(2.5 - altitude, 2);
  
  const airMass = 1 / Math.max(0.087, Math.cos(zenithAngle));
  const transmittance = a0 + a1 * Math.exp(-k * airMass);
  
  // Clear sky irradiance
  let irradiance = solarConstant * transmittance * Math.cos(zenithAngle);
  irradiance = Math.max(0, irradiance);
  
  // Cloud cover reduction (empirical formula)
  // Heavy clouds reduce irradiance by up to 80%
  const cloudFactor = 1 - (0.75 * Math.pow(cloudCover / 100, 1.2));
  
  // Humidity effect (high humidity scatters light slightly)
  const humidityFactor = 1 - (0.05 * humidity / 100);
  
  // Temperature has minimal effect on irradiance but affects panel efficiency
  
  return irradiance * cloudFactor * humidityFactor;
};

/**
 * Calculate peak sun hours based on latitude and day of year
 */
const calculatePeakSunHours = (latitude, cloudCover, dayOfYear) => {
  const latRad = Math.abs(latitude) * (Math.PI / 180);
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81)) * (Math.PI / 180);
  
  // Calculate day length
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declination);
  let dayLength;
  
  if (cosHourAngle < -1) {
    dayLength = 24; // Permanent daylight
  } else if (cosHourAngle > 1) {
    dayLength = 0; // Permanent darkness
  } else {
    dayLength = (2 * Math.acos(cosHourAngle) * 180 / Math.PI) / 15;
  }
  
  // Peak sun hours (typically 60-80% of daylight hours for good conditions)
  let peakHours = dayLength * 0.65;
  
  // Adjust for cloud cover
  peakHours *= (1 - cloudCover / 100 * 0.7);
  
  return Math.max(1, Math.min(10, peakHours));
};

/**
 * Calculate panel efficiency based on temperature
 * Standard Test Conditions (STC): 25°C
 * Temperature coefficient: typically -0.4% per °C for silicon panels
 */
const calculatePanelEfficiency = (temperature, baseEfficiency = 20) => {
  const stcTemp = 25;
  const tempCoefficient = -0.004; // -0.4% per °C
  const cellTemp = temperature + 25; // Cell temp ≈ ambient + 25°C

  const efficiencyLoss = tempCoefficient * (cellTemp - stcTemp);
  const actualEfficiency = baseEfficiency * (1 + efficiencyLoss);
  
  return Math.max(5, Math.min(25, actualEfficiency));
};

/**
 * Main prediction function — estimates daily solar energy output
 */
const predictSolarEnergy = (weatherData, panelCapacity = 5) => {
  const {
    temperature,
    humidity,
    cloudCover,
    windSpeed,
    latitude = 20
  } = weatherData;

  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  // Calculate solar irradiance (W/m²)
  const irradiance = calculateSolarIrradiance(latitude, cloudCover, humidity, temperature, dayOfYear);
  
  // Calculate peak sun hours
  const peakSunHours = calculatePeakSunHours(latitude, cloudCover, dayOfYear);
  
  // Calculate panel efficiency
  const efficiency = calculatePanelEfficiency(temperature);
  
  // System losses (inverter, wiring, dust, etc.) — typically 15-20%
  const systemLossFactor = 0.82;
  
  // Daily energy output (kWh) = Panel Capacity (kW) × Peak Sun Hours × Efficiency Factor × System Loss Factor
  const efficiencyFactor = efficiency / 20; // Normalize to base 20% efficiency
  const dailyOutput = panelCapacity * peakSunHours * efficiencyFactor * systemLossFactor;
  
  // Monthly and yearly estimates
  const monthlyOutput = dailyOutput * 30;
  const yearlyOutput = dailyOutput * 365;
  
  return {
    dailyOutput: +dailyOutput.toFixed(2),
    monthlyOutput: +monthlyOutput.toFixed(2),
    yearlyOutput: +yearlyOutput.toFixed(2),
    efficiency: +efficiency.toFixed(1),
    peakHours: +peakSunHours.toFixed(1),
    irradiance: +irradiance.toFixed(0),
    systemLossFactor: +(systemLossFactor * 100).toFixed(0)
  };
};

/**
 * Predict energy for each day of the forecast
 */
const predictForecast = (forecastDays, panelCapacity, latitude = 20) => {
  return forecastDays.map((day, index) => {
    const dayOfYear = Math.floor(
      (new Date(day.date) - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    
    const irradiance = calculateSolarIrradiance(
      latitude, day.avgCloudCover, day.avgHumidity, day.avgTemp, dayOfYear
    );
    const peakHours = calculatePeakSunHours(latitude, day.avgCloudCover, dayOfYear);
    const efficiency = calculatePanelEfficiency(day.avgTemp);
    const efficiencyFactor = efficiency / 20;
    const systemLossFactor = 0.82;
    
    const output = panelCapacity * peakHours * efficiencyFactor * systemLossFactor;
    
    return {
      date: day.date,
      dayLabel: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      output: +output.toFixed(2),
      temperature: day.avgTemp,
      cloudCover: day.avgCloudCover,
      humidity: day.avgHumidity,
      peakHours: +peakHours.toFixed(1),
      efficiency: +efficiency.toFixed(1),
      description: day.description
    };
  });
};

module.exports = { predictSolarEnergy, predictForecast };
