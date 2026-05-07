import React from 'react';

/**
 * Skeleton loading component with shimmer effect.
 * Usage: <LoadingSkeleton variant="card" /> or <LoadingSkeleton variant="chart" />
 */
export default function LoadingSkeleton({ variant = 'card', count = 1 }) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="skeleton skeleton--card">
            <div className="skeleton__header">
              <div className="skeleton__circle" />
              <div className="skeleton__line skeleton__line--md" />
            </div>
            <div className="skeleton__body">
              <div className="skeleton__line skeleton__line--full" />
              <div className="skeleton__line skeleton__line--lg" />
              <div className="skeleton__line skeleton__line--sm" />
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className="skeleton skeleton--chart">
            <div className="skeleton__header">
              <div className="skeleton__circle" />
              <div className="skeleton__line skeleton__line--md" />
            </div>
            <div className="skeleton__chart-bars">
              {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                <div key={i} className="skeleton__bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        );
      case 'gauge':
        return (
          <div className="skeleton skeleton--gauge">
            <div className="skeleton__header">
              <div className="skeleton__circle" />
              <div className="skeleton__line skeleton__line--md" />
            </div>
            <div className="skeleton__gauge-ring" />
            <div className="skeleton__gauge-stats">
              <div className="skeleton__line skeleton__line--sm" />
              <div className="skeleton__line skeleton__line--sm" />
              <div className="skeleton__line skeleton__line--sm" />
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="skeleton skeleton--table">
            <div className="skeleton__table-row skeleton__table-row--header">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="skeleton__line skeleton__line--sm" />
              ))}
            </div>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="skeleton__table-row">
                {Array(5).fill(0).map((_, j) => (
                  <div key={j} className="skeleton__line skeleton__line--sm" />
                ))}
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="skeleton skeleton--card">
            <div className="skeleton__line skeleton__line--full" />
            <div className="skeleton__line skeleton__line--lg" />
          </div>
        );
    }
  };

  return (
    <>
      {Array(count).fill(0).map((_, i) => (
        <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
      ))}
    </>
  );
}
