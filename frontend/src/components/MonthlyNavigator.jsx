import React from 'react';
import { useMonth } from '../context/MonthContext';
import { formatMonthYear } from '../utils/formatters';

function MonthlyNavigator() {
  const { selectedMonth, previousMonth, nextMonth, goToCurrentMonth } = useMonth();

  return (
    <div className="monthly-navigator">
      <button onClick={previousMonth} className="nav-btn">
        &larr;
      </button>
      <button onClick={goToCurrentMonth} className="current-btn">
        {formatMonthYear(selectedMonth.month, selectedMonth.year)}
      </button>
      <button onClick={nextMonth} className="nav-btn">
        &rarr;
      </button>
    </div>
  );
}

export default MonthlyNavigator;
