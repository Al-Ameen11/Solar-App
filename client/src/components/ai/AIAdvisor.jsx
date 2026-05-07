import React, { useState } from 'react';
import { fetchAdvice } from '../../services/api';

export default function AIAdvisor({ predictionData, financialData, weatherData }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInitialAdvice, setHasInitialAdvice] = useState(false);

  const getAdvice = async (userQuestion = '') => {
    if (!predictionData || !weatherData) return;

    setLoading(true);
    if (userQuestion) {
      setMessages(prev => [...prev, { type: 'user', text: userQuestion }]);
    }

    try {
      const result = await fetchAdvice(predictionData, financialData, weatherData, userQuestion);
      setMessages(prev => [...prev, { type: 'ai', text: result.data.advice }]);
      setHasInitialAdvice(true);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { type: 'ai', text: '⚠️ Unable to get AI advice at the moment. Please check your API configuration.' }
      ]);
    }
    setLoading(false);
    setQuestion('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      getAdvice(question.trim());
    }
  };

  const canUse = predictionData && weatherData;

  return (
    <div className="card animate-on-scroll" id="ai-advisor">
      <div className="card__header">
        <div className="card__header-left">
          <span className="card__icon">🤖</span>
          <h2 className="card__title">AI Solar Advisor</h2>
        </div>
        <span className="badge badge--blue">Gemini AI</span>
      </div>

      <div className="advisor">
        <div className="advisor__messages" id="advisor-messages">
          {messages.length === 0 && !loading && (
            <div className="advisor__empty">
              <div className="advisor__empty-icon">💬</div>
              <p>
                {canUse
                  ? 'Click "Get AI Analysis" for a comprehensive assessment, or ask a question below.'
                  : 'Run a solar prediction first to enable the AI advisor.'}
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`advisor__bubble advisor__bubble--${msg.type}`}>
              <div className="advisor__bubble-avatar">
                {msg.type === 'ai' ? '🤖' : '👤'}
              </div>
              <div className="advisor__bubble-content">{msg.text}</div>
            </div>
          ))}

          {loading && (
            <div className="advisor__bubble advisor__bubble--ai">
              <div className="advisor__bubble-avatar">🤖</div>
              <div className="advisor__bubble-content">
                <div className="advisor__typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
        </div>

        {!hasInitialAdvice && canUse && (
          <button
            className="btn btn-primary btn-full"
            onClick={() => getAdvice()}
            disabled={loading}
            id="get-ai-analysis-btn"
          >
            🤖 Get AI Analysis
          </button>
        )}

        <form className="advisor__input" onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-input"
            id="advisor-question-input"
            placeholder={canUse ? 'Ask about solar panels, savings...' : 'Run prediction first...'}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading || !canUse}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !question.trim() || !canUse}
            id="ask-ai-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
