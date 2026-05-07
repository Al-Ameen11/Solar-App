import React from 'react';

export default function FinancialAnalysis({ financials, prediction }) {
  if (!financials) return null;

  const roiPercentage = Math.min(100, (25 / (financials.roi?.period || 25)) * 100);

  const formatCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val?.toLocaleString() || 0}`;
  };

  const costItems = [
    { label: 'Installation Cost', value: formatCurrency(financials.installationCost?.gross), color: 'default' },
    { label: 'Government Subsidy', value: `- ${formatCurrency(financials.installationCost?.subsidy)}`, sub: 'PM Surya Ghar Yojana', color: 'green' },
    { label: 'Net Cost', value: formatCurrency(financials.installationCost?.net), color: 'amber' },
    { label: 'Monthly Savings', value: formatCurrency(financials.savings?.monthly), sub: `@ ₹${financials.electricityRate}/kWh`, color: 'green' },
    { label: 'Yearly Savings', value: formatCurrency(financials.savings?.yearly), color: 'green' },
    { label: '25-Year Net Savings', value: formatCurrency(financials.savings?.netOver25Years), sub: 'After installation & maintenance', color: 'green' },
  ];

  return (
    <div className="card animate-on-scroll" id="financial-analysis">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">💰</span>
          <h2 className="card__title">Financial Analysis & ROI</h2>
        </div>
      </div>

      <div className="finance-grid">
        {costItems.map((item, i) => (
          <div className="finance-card" key={i}>
            <div className="finance-card__label">{item.label}</div>
            <div className={`finance-card__value finance-card__value--${item.color}`}>
              {item.value}
            </div>
            {item.sub && <div className="finance-card__sub">{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* ROI Bar */}
      <div className="roi-section">
        <div className="roi-section__header">
          <span>ROI Period</span>
          <span className="roi-section__period">{financials.roi?.period} years</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${roiPercentage}%` }} />
        </div>
        <div className="roi-section__footer">
          <span>Investment Recovery</span>
          <span className="roi-section__pct">{financials.roi?.percentage}% Annual ROI</span>
        </div>
      </div>

      {/* Bill Comparison */}
      {financials.billComparison && (
        <div className="bill-compare">
          <h3 className="bill-compare__title">📊 Before vs After Solar</h3>
          <div className="bill-compare__grid">
            <div className="bill-compare__item">
              <div className="bill-compare__label">Current Bill</div>
              <div className="bill-compare__value bill-compare__value--red">
                ₹{financials.billComparison.currentBill?.toLocaleString()}
              </div>
              <div className="bill-compare__sub">per month</div>
            </div>
            <div className="bill-compare__item">
              <div className="bill-compare__label">After Solar</div>
              <div className="bill-compare__value bill-compare__value--green">
                ₹{financials.billComparison.newBill?.toLocaleString()}
              </div>
              <div className="bill-compare__sub">per month</div>
            </div>
            <div className="bill-compare__item">
              <div className="bill-compare__label">You Save</div>
              <div className="bill-compare__value bill-compare__value--amber">
                ₹{financials.billComparison.monthlySaved?.toLocaleString()}
              </div>
              <div className="bill-compare__sub">per month</div>
            </div>
          </div>
          <div className="bill-compare__summary">
            ☀️ Solar covers <strong>{financials.billComparison.solarCoversPercent}%</strong> of your usage
            &nbsp;•&nbsp; Save <strong>₹{financials.billComparison.yearlySaved?.toLocaleString()}/year</strong>
          </div>
        </div>
      )}

      {/* Environmental */}
      <div className="env-grid">
        <div className="env-card">
          <div className="env-card__value">{financials.environmental?.co2OffsetYearly}</div>
          <div className="env-card__label">kg CO₂ Offset/Year</div>
        </div>
        <div className="env-card">
          <div className="env-card__value">{financials.environmental?.treesEquivalent}</div>
          <div className="env-card__label">Trees Equivalent 🌳</div>
        </div>
        <div className="env-card">
          <div className="env-card__value">{prediction?.yearlyOutput}</div>
          <div className="env-card__label">kWh Clean Energy/Year</div>
        </div>
      </div>
    </div>
  );
}
