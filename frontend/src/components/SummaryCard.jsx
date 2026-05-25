import React from 'react';
import { formatCurrency } from '../utils/formatters';

function SummaryCard({ title, value, icon, variant = 'default' }) {
  const numValue = parseFloat(value) || 0;
  const variantClass = `summary-card summary-card--${variant}`;

  return (
    <div className={variantClass}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <span className="card-title">{title}</span>
      </div>
      <div className="card-value">{formatCurrency(numValue)}</div>
    </div>
  );
}

export default SummaryCard;
