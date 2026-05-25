import React from 'react';

function BudgetProgressBar({ spent, limit, label }) {
  const spentNum = parseFloat(spent) || 0;
  const limitNum = parseFloat(limit) || 0;
  const percentage = limitNum > 0 ? Math.min((spentNum / limitNum) * 100, 100) : 0;
  const isExceeded = limitNum > 0 && spentNum > limitNum;
  const isWarning = percentage >= 80 && !isExceeded;

  const barColor = isExceeded ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';
  const statusText = isExceeded ? 'Teto excedido!' : isWarning ? 'Atencao!' : 'Dentro do limite';

  return (
    <div className="budget-progress">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-status" style={{ color: barColor }}>
          {statusText}
        </span>
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${isExceeded ? 100 : percentage}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="progress-details">
        <span>R$ {spentNum.toFixed(2)} / R$ {limitNum.toFixed(2)}</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default BudgetProgressBar;
