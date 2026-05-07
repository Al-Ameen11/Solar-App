import React, { useState, useEffect } from 'react';
import { fetchSubsidies } from '../../services/api';

export default function SubsidyInfo({ state = 'default', panelCapacity = 5 }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubsidies();
  }, []);

  const loadSubsidies = async () => {
    try {
      const result = await fetchSubsidies('residential');
      setSchemes(result.data.schemes || []);
    } catch (error) {
      setSchemes([
        {
          name: 'PM Surya Ghar: Muft Bijli Yojana',
          description: 'Central government scheme providing subsidies up to ₹78,000 for rooftop solar installations.',
          subsidyDetails: [
            { capacity: '1 kW', subsidy: '₹30,000' },
            { capacity: '2 kW', subsidy: '₹60,000' },
            { capacity: '3+ kW', subsidy: '₹78,000 (max)' }
          ],
          website: 'https://pmsuryaghar.gov.in/',
          eligibility: 'Indian residential electricity consumers'
        },
        {
          name: 'State Net Metering Policy',
          description: 'Export excess solar power to the grid and receive credits on your electricity bill.',
          subsidyDetails: [{ capacity: 'All', subsidy: 'Bill Credit' }],
          website: '#',
          eligibility: 'Residential consumers with rooftop solar'
        }
      ]);
    }
    setLoading(false);
  };

  const getPersonalizedSubsidy = () => {
    if (panelCapacity <= 2) return panelCapacity * 30000;
    if (panelCapacity <= 3) return 60000 + (panelCapacity - 2) * 18000;
    return 78000;
  };

  const formatCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  const stateNames = {
    default: 'India (Average)', maharashtra: 'Maharashtra', delhi: 'Delhi',
    karnataka: 'Karnataka', tamilnadu: 'Tamil Nadu', rajasthan: 'Rajasthan',
    gujarat: 'Gujarat', kerala: 'Kerala', andhra: 'Andhra Pradesh',
    telangana: 'Telangana', westbengal: 'West Bengal', up: 'Uttar Pradesh',
    punjab: 'Punjab', madhyapradesh: 'Madhya Pradesh', bihar: 'Bihar'
  };

  return (
    <div className="card animate-on-scroll" id="subsidy-info">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">🏛️</span>
          <h2 className="card__title">Government Subsidies</h2>
        </div>
      </div>

      {/* Personalized subsidy */}
      <div className="subsidy-highlight">
        <div className="subsidy-highlight__left">
          <div className="subsidy-highlight__label">Your Subsidy (PM Surya Ghar)</div>
          <div className="subsidy-highlight__value">{formatCurrency(getPersonalizedSubsidy())}</div>
        </div>
        <div className="subsidy-highlight__right">
          For {panelCapacity} kW • {stateNames[state] || state}
        </div>
      </div>

      {loading ? (
        <div className="loading-center">
          <span className="spinner" /> Loading schemes...
        </div>
      ) : (
        <div className="subsidy-list">
          {schemes.map((scheme, index) => (
            <div className="subsidy-item" key={index}>
              <div className="subsidy-item__name">{scheme.name}</div>
              <div className="subsidy-item__desc">{scheme.description}</div>
              <div className="subsidy-item__tags">
                {scheme.subsidyDetails?.map((detail, i) => (
                  <span className="tag tag--amber" key={i}>
                    {detail.capacity}: {detail.subsidy}
                  </span>
                ))}
              </div>
              {scheme.eligibility && (
                <div className="subsidy-item__eligibility">
                  ✅ {scheme.eligibility}
                </div>
              )}
              {scheme.website && scheme.website !== '#' && (
                <a href={scheme.website} target="_blank" rel="noopener noreferrer" className="subsidy-item__link">
                  Visit Official Website →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
