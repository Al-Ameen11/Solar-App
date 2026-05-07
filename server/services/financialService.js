/**
 * Financial Analysis & ROI Service for Solar Installations
 * Includes Indian subsidy schemes and electricity rate calculations
 */

// Average electricity rates by state (₹/kWh) - India
const ELECTRICITY_RATES = {
  default: 7.5,
  maharashtra: 9.5,
  delhi: 6.5,
  karnataka: 7.0,
  tamilnadu: 5.5,
  rajasthan: 8.0,
  gujarat: 5.8,
  kerala: 6.8,
  andhra: 7.2,
  telangana: 7.5,
  westbengal: 8.5,
  up: 6.0,
  punjab: 7.5,
  madhyapradesh: 6.5,
  bihar: 7.0
};

// Solar installation costs (₹ per kW) - India 2024/2025
const INSTALLATION_COSTS = {
  perKW: {
    1: 65000,  // 1 kW system
    2: 58000,  // per kW for 2 kW
    3: 52000,  // per kW for 3+ kW
    5: 48000,  // per kW for 5+ kW
    10: 42000  // per kW for 10+ kW
  }
};

// Government Subsidy Schemes
const SUBSIDY_SCHEMES = [
  {
    id: 'pm-surya-ghar',
    name: 'PM Surya Ghar: Muft Bijli Yojana',
    description: 'Central government scheme providing subsidies for rooftop solar installations for residential consumers.',
    eligibility: 'Indian residential electricity consumers with a valid electricity connection.',
    subsidyDetails: [
      { capacity: '1 kW', subsidy: '₹30,000', note: '₹30,000 for 1 kW system' },
      { capacity: '2 kW', subsidy: '₹60,000', note: '₹30,000/kW for first 2 kW' },
      { capacity: '3 kW', subsidy: '₹78,000', note: '₹30,000/kW for 2 kW + ₹18,000/kW for next 1 kW' },
      { capacity: '3-10 kW', subsidy: '₹78,000 (max)', note: 'Subsidy capped at ₹78,000 for 3 kW and above' }
    ],
    website: 'https://pmsuryaghar.gov.in/',
    maxSubsidy: 78000
  },
  {
    id: 'state-net-metering',
    name: 'State Net Metering Policy',
    description: 'Most Indian states allow net metering, where excess solar power is exported to the grid and credited to your electricity bill.',
    eligibility: 'Residential and commercial consumers with rooftop solar in participating states.',
    subsidyDetails: [
      { capacity: 'All', subsidy: 'Bill Credit', note: 'Excess power exported earns credits on your bill' }
    ],
    website: '#',
    maxSubsidy: 0
  },
  {
    id: 'accelerated-depreciation',
    name: 'Accelerated Depreciation Benefit',
    description: 'Commercial and industrial consumers can claim 40% accelerated depreciation on solar installations.',
    eligibility: 'Commercial and industrial electricity consumers.',
    subsidyDetails: [
      { capacity: 'Commercial', subsidy: '40% Depreciation', note: 'Tax benefit on solar asset value' }
    ],
    website: '#',
    maxSubsidy: 0
  },
  {
    id: 'kusum',
    name: 'PM-KUSUM Scheme',
    description: 'Solar pumps and grid-connected solar for farmers. Supports agricultural solar adoption.',
    eligibility: 'Farmers and agricultural consumers.',
    subsidyDetails: [
      { capacity: 'Solar Pumps', subsidy: '60% Subsidy', note: '30% Central + 30% State subsidy' }
    ],
    website: 'https://mnre.gov.in/solar/schemes/',
    maxSubsidy: 0
  }
];

/**
 * Calculate installation cost based on panel capacity
 */
const calculateInstallationCost = (capacityKW) => {
  let perKW;
  if (capacityKW <= 1) perKW = INSTALLATION_COSTS.perKW[1];
  else if (capacityKW <= 2) perKW = INSTALLATION_COSTS.perKW[2];
  else if (capacityKW <= 4) perKW = INSTALLATION_COSTS.perKW[3];
  else if (capacityKW <= 8) perKW = INSTALLATION_COSTS.perKW[5];
  else perKW = INSTALLATION_COSTS.perKW[10];
  
  return capacityKW * perKW;
};

/**
 * Calculate government subsidy (PM Surya Ghar)
 */
const calculateSubsidy = (capacityKW) => {
  if (capacityKW <= 2) {
    return capacityKW * 30000;
  } else if (capacityKW <= 3) {
    return 60000 + (capacityKW - 2) * 18000;
  } else {
    return 78000; // Max subsidy
  }
};

/**
 * Complete financial analysis
 * @param {object} prediction - Solar prediction data
 * @param {number} panelCapacity - Panel capacity in kW
 * @param {string} state - Indian state for electricity rate
 * @param {number} monthlyBill - Optional: user's actual monthly electricity bill (₹)
 */
const calculateFinancials = (prediction, panelCapacity, state = 'default', monthlyBill = 0) => {
  // If user provides their bill, derive the actual rate
  let electricityRate;
  let estimatedMonthlyUsage = 0; // kWh

  if (monthlyBill > 0) {
    // Average Indian household consumption: bill / estimated rate to get kWh
    // Use state rate as a starting point to estimate usage
    const baseRate = ELECTRICITY_RATES[state.toLowerCase()] || ELECTRICITY_RATES.default;
    estimatedMonthlyUsage = monthlyBill / baseRate;
    electricityRate = baseRate;
  } else {
    electricityRate = ELECTRICITY_RATES[state.toLowerCase()] || ELECTRICITY_RATES.default;
  }
  
  // Installation cost
  const grossCost = calculateInstallationCost(panelCapacity);
  const subsidy = calculateSubsidy(panelCapacity);
  const netCost = grossCost - subsidy;
  
  // Savings calculations
  const monthlySavings = prediction.monthlyOutput * electricityRate;
  const yearlySavings = prediction.yearlyOutput * electricityRate;
  
  // ROI period (years)
  const roiPeriod = yearlySavings > 0 ? netCost / yearlySavings : 0;
  
  // 25-year savings (accounting for 0.5% annual panel degradation and 5% annual electricity rate increase)
  let totalSavings25 = 0;
  let currentRate = electricityRate;
  let currentOutput = prediction.yearlyOutput;
  
  for (let year = 1; year <= 25; year++) {
    totalSavings25 += currentOutput * currentRate;
    currentOutput *= 0.995; // 0.5% degradation
    currentRate *= 1.05;    // 5% rate increase
  }
  
  // Maintenance cost (₹2000/year)
  const maintenanceCost25 = 2000 * 25;
  const netSavings25 = totalSavings25 - netCost - maintenanceCost25;
  
  // CO2 offset (0.82 kg CO2 per kWh for Indian grid)
  const co2OffsetYearly = prediction.yearlyOutput * 0.82; // kg
  const treesEquivalent = co2OffsetYearly / 21; // 1 tree absorbs ~21 kg CO2/year

  // Bill comparison (only if user provided their bill)
  let billComparison = null;
  if (monthlyBill > 0) {
    const solarCovers = Math.min(prediction.monthlyOutput / estimatedMonthlyUsage, 1.0);
    const newBill = Math.max(0, monthlyBill - monthlySavings);
    billComparison = {
      currentBill: +monthlyBill.toFixed(0),
      estimatedUsage: +estimatedMonthlyUsage.toFixed(0),
      solarGeneration: +prediction.monthlyOutput.toFixed(0),
      solarCoversPercent: +(solarCovers * 100).toFixed(0),
      newBill: +newBill.toFixed(0),
      monthlySaved: +Math.min(monthlySavings, monthlyBill).toFixed(0),
      yearlySaved: +(Math.min(monthlySavings, monthlyBill) * 12).toFixed(0)
    };
  }
  
  return {
    installationCost: {
      gross: +grossCost.toFixed(0),
      subsidy: +subsidy.toFixed(0),
      net: +netCost.toFixed(0)
    },
    savings: {
      monthly: +monthlySavings.toFixed(0),
      yearly: +yearlySavings.toFixed(0),
      over25Years: +totalSavings25.toFixed(0),
      netOver25Years: +netSavings25.toFixed(0)
    },
    roi: {
      period: +roiPeriod.toFixed(1),
      percentage: +((yearlySavings / netCost) * 100).toFixed(1)
    },
    electricityRate,
    billComparison,
    environmental: {
      co2OffsetYearly: +co2OffsetYearly.toFixed(0),
      co2OffsetMonthly: +(co2OffsetYearly / 12).toFixed(0),
      treesEquivalent: +treesEquivalent.toFixed(0)
    },
    maintenance: {
      yearlyMaintenance: 2000,
      totalMaintenance25: maintenanceCost25
    }
  };
};

/**
 * Get applicable subsidy schemes
 */
const getSubsidySchemes = (userType = 'residential') => {
  if (userType === 'residential') {
    return SUBSIDY_SCHEMES.filter(s => s.id !== 'accelerated-depreciation' && s.id !== 'kusum');
  } else if (userType === 'commercial') {
    return SUBSIDY_SCHEMES.filter(s => s.id !== 'kusum');
  } else if (userType === 'agricultural') {
    return SUBSIDY_SCHEMES;
  }
  return SUBSIDY_SCHEMES;
};

module.exports = { calculateFinancials, getSubsidySchemes, calculateSubsidy, ELECTRICITY_RATES };
