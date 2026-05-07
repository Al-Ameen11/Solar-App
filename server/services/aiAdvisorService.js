/**
 * AI Advisor Service using Google Gemini
 * Provides plain-language explanations and smart appliance recommendations
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;
let aiBackoffUntil = 0;
let lastQuotaLogAt = 0;

const QUOTA_LOG_INTERVAL_MS = 60 * 1000;
const DEFAULT_BACKOFF_MS = 60 * 1000;

const extractRetryDelayMs = (message = '') => {
  const retryInMatch = message.match(/retry in ([\d.]+)s/i);
  if (retryInMatch) {
    return Math.max(1000, Math.ceil(Number(retryInMatch[1]) * 1000));
  }

  const retryDelayMatch = message.match(/\"retryDelay\":\"(\d+)s\"/i);
  if (retryDelayMatch) {
    return Math.max(1000, Number(retryDelayMatch[1]) * 1000);
  }

  return DEFAULT_BACKOFF_MS;
};

const isQuotaError = (message = '') => {
  return /429|quota exceeded|too many requests|rate[\s-]?limit/i.test(message);
};

const canUseGemini = () => {
  return !!model && Date.now() >= aiBackoffUntil;
};

const handleGeminiError = (error, contextLabel) => {
  const errorMessage = error?.message || 'Unknown Gemini API error';

  if (isQuotaError(errorMessage)) {
    const backoffMs = extractRetryDelayMs(errorMessage);
    aiBackoffUntil = Date.now() + backoffMs;

    if (Date.now() - lastQuotaLogAt > QUOTA_LOG_INTERVAL_MS) {
      const retrySeconds = Math.ceil(backoffMs / 1000);
      console.warn(
        `${contextLabel}: Gemini quota/rate limit hit. Using fallback responses for ~${retrySeconds}s.`
      );
      lastQuotaLogAt = Date.now();
    }
    return;
  }

  console.error(`${contextLabel}: ${errorMessage}`);
};

const initializeAI = () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.log('⚠️  Gemini API key not configured. AI advisor will use fallback responses.');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    aiBackoffUntil = 0;
    return true;
  } catch (error) {
    console.error('Failed to initialize Gemini:', error.message);
    return false;
  }
};

/**
 * Generate solar energy advice based on prediction data
 * If userQuestion is provided, answer ONLY that question.
 * If no question, give a brief summary.
 */
const getSolarAdvice = async (predictionData, financialData, weatherData, userQuestion = '') => {
  const context = buildContext(predictionData, financialData, weatherData);

  let prompt;

  if (userQuestion) {
    // USER ASKED A SPECIFIC QUESTION — answer ONLY that
    prompt = `You are a friendly solar energy advisor for a homeowner in India. You have the following data about their solar setup:

${context}

The user is asking: "${userQuestion}"

IMPORTANT RULES:
- Answer ONLY the user's question. Do NOT give a full analysis.
- Keep your response short and direct (2-4 sentences max for simple questions, up to 1 paragraph for complex ones).
- Use simple, non-technical language a common person can understand.
- Use ₹ for currency.
- If the user asks something unrelated to solar/energy, politely say you can only help with solar energy topics.
- Use 1-2 emojis max (☀️, 💰, 🌿, ⚡).
- Do NOT repeat data the user already sees on the dashboard.`;
  } else {
    // NO QUESTION — give a brief initial summary
    prompt = `You are a friendly solar energy advisor helping a non-technical homeowner in India. Give a SHORT, simple summary (3 short paragraphs max) of their solar potential.

${context}

IMPORTANT RULES:
- Write like you're talking to a friend, not writing a report.
- Use very simple language — imagine explaining to your grandmother.
- Keep it SHORT. Maximum 3 small paragraphs.
- Paragraph 1: How much energy their panels will make (in simple terms like "enough to run your AC for X hours")
- Paragraph 2: How much money they save and when they get their investment back
- Paragraph 3: One practical tip they can act on today
- Use ₹ for currency.
- Use 1-2 emojis max. No markdown headers (no **bold**, no bullets).
- Do NOT list everything — just the highlights that matter most.`;
  }

  if (canUseGemini()) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      handleGeminiError(error, 'Gemini API error');
      return generateFallbackAdvice(predictionData, financialData, weatherData, userQuestion);
    }
  }
  
  return generateFallbackAdvice(predictionData, financialData, weatherData, userQuestion);
};

/**
 * Generate smart appliance usage alerts
 * Now includes forecast data for today vs tomorrow comparison
 */
const getApplianceAlerts = async (predictionData, weatherData, forecastData = []) => {
  // Build forecast comparison context
  let forecastContext = '';
  if (forecastData && forecastData.length > 0) {
    const tomorrow = forecastData[0];
    forecastContext = `
TOMORROW'S FORECAST:
- Date: ${tomorrow.date || tomorrow.dayLabel || 'Tomorrow'}
- Expected Output: ${tomorrow.output} kWh
- Temperature: ${tomorrow.temperature}°C
- Cloud Cover: ${tomorrow.cloudCover}%
- Weather: ${tomorrow.description || 'N/A'}
- Change from today: ${((tomorrow.output - predictionData.dailyOutput) / predictionData.dailyOutput * 100).toFixed(0)}%`;
  }

  const prompt = `You are a smart home energy advisor. Based on the solar energy data below, provide 5-6 appliance usage recommendations.

TODAY'S SOLAR DATA:
- Solar Output: ${predictionData.dailyOutput} kWh
- Peak Sun Hours: ${predictionData.peakHours} hours
- Cloud Cover: ${weatherData.cloudCover}%
- Temperature: ${weatherData.temperature}°C
${forecastContext}

RULES:
- Give 5-6 appliance recommendations
- For each: appliance name, best time to use, brief reason, power consumption
- If tomorrow's output is LOWER than today: add a "plan ahead" alert suggesting to do heavy tasks TODAY
- If tomorrow's output is HIGHER than today: suggest postponing heavy tasks to tomorrow
- Set priority: "high" for heavy appliances, "medium" for moderate, "low" for light
- Be specific with times based on the peak sun hours data

Format as a JSON array with objects having fields: appliance, bestTime, reason, powerConsumption, priority
Return ONLY the JSON array, no other text.`;

  if (canUseGemini()) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      handleGeminiError(error, 'Gemini API error for appliance alerts');
    }
  }
  
  return generateFallbackAlerts(predictionData, forecastData);
};

/**
 * Build context string for AI
 */
function buildContext(prediction, financial, weather) {
  return `
SOLAR PREDICTION DATA:
- Location: ${weather.city || 'Unknown'}, ${weather.country || 'India'}
- Daily Energy Output: ${prediction.dailyOutput} kWh
- Monthly Energy Output: ${prediction.monthlyOutput} kWh
- Panel Efficiency: ${prediction.efficiency}%
- Peak Sun Hours: ${prediction.peakHours} hours/day

WEATHER CONDITIONS:
- Temperature: ${weather.temperature}°C
- Cloud Cover: ${weather.cloudCover}%
- Humidity: ${weather.humidity}%
- Conditions: ${weather.description}

FINANCIAL ANALYSIS:
- Installation Cost (before subsidy): ₹${financial.installationCost?.gross?.toLocaleString() || 'N/A'}
- Government Subsidy: ₹${financial.installationCost?.subsidy?.toLocaleString() || 'N/A'}
- Net Cost: ₹${financial.installationCost?.net?.toLocaleString() || 'N/A'}
- Monthly Savings: ₹${financial.savings?.monthly?.toLocaleString() || 'N/A'}
- ROI Period: ${financial.roi?.period || 'N/A'} years
- CO₂ Offset: ${financial.environmental?.co2OffsetYearly || 'N/A'} kg/year`;
}

/**
 * Fallback advice when AI is unavailable
 */
function generateFallbackAdvice(prediction, financial, weather, userQuestion = '') {
  if (userQuestion) {
    // Try to answer common questions with data we have
    const q = userQuestion.toLowerCase();
    if (q.includes('save') || q.includes('saving') || q.includes('money') || q.includes('bill')) {
      return `💰 With your current setup, you can save approximately ₹${financial.savings?.monthly?.toLocaleString() || 'N/A'} per month on electricity bills. That's about ₹${financial.savings?.yearly?.toLocaleString() || 'N/A'} per year! Your investment of ₹${financial.installationCost?.net?.toLocaleString() || 'N/A'} (after subsidy) pays for itself in about ${financial.roi?.period || 'N/A'} years.`;
    }
    if (q.includes('subsidy') || q.includes('scheme') || q.includes('government') || q.includes('pm')) {
      return `🏛️ Under the PM Surya Ghar scheme, you can get up to ₹78,000 in government subsidy. This brings your net installation cost down to ₹${financial.installationCost?.net?.toLocaleString() || 'N/A'}. Apply at pmsuryaghar.gov.in with your electricity bill and Aadhaar card.`;
    }
    if (q.includes('roi') || q.includes('payback') || q.includes('return') || q.includes('invest')) {
      return `📊 Your solar investment of ₹${financial.installationCost?.net?.toLocaleString() || 'N/A'} (after ₹${financial.installationCost?.subsidy?.toLocaleString() || 'N/A'} subsidy) will pay for itself in approximately ${financial.roi?.period || 'N/A'} years. After that, your electricity is essentially free for the remaining 20+ years of panel life!`;
    }
    if (q.includes('output') || q.includes('generate') || q.includes('produce') || q.includes('kwh')) {
      return `☀️ Your panels are expected to produce about ${prediction.dailyOutput} kWh per day in current conditions. That's roughly ${prediction.monthlyOutput} kWh per month — enough to significantly reduce your electricity bill.`;
    }
    if (q.includes('clean') || q.includes('maintain') || q.includes('care')) {
      return `🧹 Clean your panels every 2-3 weeks with plain water and a soft cloth. Avoid cleaning during hot afternoons — do it early morning. Dirty panels can lose 15-25% efficiency. Also check for bird droppings and leaves regularly.`;
    }
    // Default for unrecognized questions
    return `I can help you with questions about your solar savings (₹${financial.savings?.monthly?.toLocaleString() || 'N/A'}/month), government subsidies (up to ₹78,000), ROI (${financial.roi?.period || 'N/A'} years), energy output (${prediction.dailyOutput} kWh/day), or panel maintenance. What would you like to know?`;
  }

  // Default initial analysis (shorter and friendlier)
  return `☀️ Great news! Your solar panels can generate about ${prediction.dailyOutput} kWh per day — that's enough to power most of your home appliances during the day.

💰 You'll save roughly ₹${financial.savings?.monthly?.toLocaleString() || 'N/A'} every month on electricity. After the government subsidy of ₹${financial.installationCost?.subsidy?.toLocaleString() || 'N/A'}, your actual cost is ₹${financial.installationCost?.net?.toLocaleString() || 'N/A'}, which you'll recover in about ${financial.roi?.period || 'N/A'} years.

⚡ Quick tip: Run your washing machine, iron, and AC between 10 AM – 3 PM to use maximum solar power instead of paying for grid electricity!`;
}

/**
 * Fallback appliance alerts when AI is unavailable
 * Now includes forecast-based comparison alerts
 */
function generateFallbackAlerts(prediction, forecastData = []) {
  const alerts = [
    {
      appliance: '🧺 Washing Machine',
      bestTime: '10:00 AM - 12:00 PM',
      reason: 'Heavy power consumer — best during peak solar',
      powerConsumption: '500-2000W',
      priority: 'high'
    },
    {
      appliance: '❄️ Air Conditioner',
      bestTime: '10:00 AM - 3:00 PM',
      reason: 'Pre-cool your home using solar power before evening',
      powerConsumption: '1000-2500W',
      priority: 'high'
    },
    {
      appliance: '🔌 Iron',
      bestTime: '11:00 AM - 1:00 PM',
      reason: 'High wattage — use during peak solar hours',
      powerConsumption: '1000-2000W',
      priority: 'medium'
    },
    {
      appliance: '💧 Water Heater',
      bestTime: '10:00 AM - 12:00 PM',
      reason: 'Heat water during peak solar — use stored hot water later',
      powerConsumption: '1500-3000W',
      priority: 'high'
    },
    {
      appliance: '💻 Laptop/Phone Charging',
      bestTime: '10:00 AM - 3:00 PM',
      reason: 'Charge all devices using free solar energy',
      powerConsumption: '50-100W',
      priority: 'low'
    }
  ];

  // Add forecast-based alert if tomorrow's data is available
  if (forecastData && forecastData.length > 0) {
    const tomorrow = forecastData[0];
    const change = ((tomorrow.output - prediction.dailyOutput) / prediction.dailyOutput * 100).toFixed(0);

    if (change < -20) {
      alerts.unshift({
        appliance: '📉 Plan Ahead Alert',
        bestTime: 'Do heavy tasks TODAY',
        reason: `Tomorrow's output drops ${Math.abs(change)}% (${tomorrow.output} kWh). Run washing machine, iron, and water heater today!`,
        powerConsumption: 'N/A',
        priority: 'high'
      });
    } else if (change > 20) {
      alerts.unshift({
        appliance: '📈 Good News for Tomorrow',
        bestTime: 'Postpone heavy tasks',
        reason: `Tomorrow's output increases ${change}% (${tomorrow.output} kWh). Save heavy loads for tomorrow!`,
        powerConsumption: 'N/A',
        priority: 'medium'
      });
    } else {
      alerts.unshift({
        appliance: '📊 Tomorrow\'s Outlook',
        bestTime: `${tomorrow.dayLabel || 'Tomorrow'}`,
        reason: `Similar output expected (${tomorrow.output} kWh, ${change > 0 ? '+' : ''}${change}%). No schedule changes needed.`,
        powerConsumption: 'N/A',
        priority: 'low'
      });
    }
  }

  return alerts;
}

module.exports = { getSolarAdvice, getApplianceAlerts, initializeAI };
