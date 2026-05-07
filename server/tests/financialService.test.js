/**
 * Tests for financialService.js
 * Tests financial calculations, subsidy logic, and ROI
 */
const { calculateFinancials, getSubsidySchemes, calculateSubsidy, ELECTRICITY_RATES } = require('../services/financialService');

describe('calculateSubsidy', () => {
  test('1 kW system should get ₹30,000', () => {
    expect(calculateSubsidy(1)).toBe(30000);
  });

  test('2 kW system should get ₹60,000', () => {
    expect(calculateSubsidy(2)).toBe(60000);
  });

  test('3 kW system should get ₹78,000', () => {
    expect(calculateSubsidy(3)).toBe(78000);
  });

  test('5 kW system should be capped at ₹78,000', () => {
    expect(calculateSubsidy(5)).toBe(78000);
  });

  test('10 kW system should be capped at ₹78,000', () => {
    expect(calculateSubsidy(10)).toBe(78000);
  });

  test('2.5 kW system should get prorated amount', () => {
    const subsidy = calculateSubsidy(2.5);
    expect(subsidy).toBe(60000 + 0.5 * 18000); // 69000
  });
});

describe('calculateFinancials', () => {
  const prediction = {
    dailyOutput: 20,
    monthlyOutput: 600,
    yearlyOutput: 7300,
    efficiency: 18,
    peakHours: 5
  };

  test('should return all financial sections', () => {
    const result = calculateFinancials(prediction, 5, 'maharashtra');
    expect(result).toHaveProperty('installationCost');
    expect(result).toHaveProperty('savings');
    expect(result).toHaveProperty('roi');
    expect(result).toHaveProperty('electricityRate');
    expect(result).toHaveProperty('environmental');
    expect(result).toHaveProperty('maintenance');
  });

  test('net cost should be gross minus subsidy', () => {
    const result = calculateFinancials(prediction, 5, 'delhi');
    expect(result.installationCost.net).toBe(
      result.installationCost.gross - result.installationCost.subsidy
    );
  });

  test('should use state-specific electricity rate', () => {
    const mh = calculateFinancials(prediction, 5, 'maharashtra');
    const tn = calculateFinancials(prediction, 5, 'tamilnadu');
    expect(mh.electricityRate).toBe(ELECTRICITY_RATES.maharashtra);
    expect(tn.electricityRate).toBe(ELECTRICITY_RATES.tamilnadu);
  });

  test('should use default rate for unknown state', () => {
    const result = calculateFinancials(prediction, 5, 'unknown');
    expect(result.electricityRate).toBe(ELECTRICITY_RATES.default);
  });

  test('ROI period should be positive', () => {
    const result = calculateFinancials(prediction, 5, 'default');
    expect(result.roi.period).toBeGreaterThan(0);
  });

  test('25-year savings should be positive for a good solar setup', () => {
    const result = calculateFinancials(prediction, 5, 'default');
    expect(result.savings.netOver25Years).toBeGreaterThan(0);
  });

  test('CO2 offset should be calculated correctly', () => {
    const result = calculateFinancials(prediction, 5, 'default');
    expect(result.environmental.co2OffsetYearly).toBe(Math.round(7300 * 0.82));
  });
});

describe('getSubsidySchemes', () => {
  test('should return residential schemes', () => {
    const schemes = getSubsidySchemes('residential');
    expect(schemes.length).toBeGreaterThan(0);
    expect(schemes.some(s => s.id === 'pm-surya-ghar')).toBe(true);
  });

  test('should not include agricultural scheme for residential', () => {
    const schemes = getSubsidySchemes('residential');
    expect(schemes.some(s => s.id === 'kusum')).toBe(false);
  });

  test('should include all schemes for agricultural', () => {
    const schemes = getSubsidySchemes('agricultural');
    expect(schemes.some(s => s.id === 'kusum')).toBe(true);
  });
});
