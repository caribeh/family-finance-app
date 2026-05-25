import React, { createContext, useState, useContext, useEffect } from 'react';

const MonthContext = createContext(null);

export function MonthProvider({ children }) {
  const now = new Date();
  const stored = localStorage.getItem('selectedMonth');

  const initialMonth = stored
    ? JSON.parse(stored)
    : { month: now.getMonth() + 1, year: now.getFullYear() };

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  useEffect(() => {
    localStorage.setItem('selectedMonth', JSON.stringify(selectedMonth));
  }, [selectedMonth]);

  const setMonth = (month, year) => {
    setSelectedMonth({ month, year });
  };

  const previousMonth = () => {
    setSelectedMonth((prev) => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
      return { month: m, year: y };
    });
  };

  const nextMonth = () => {
    setSelectedMonth((prev) => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      return { month: m, year: y };
    });
  };

  const goToCurrentMonth = () => {
    setSelectedMonth({ month: now.getMonth() + 1, year: now.getFullYear() });
  };

  const monthLabel = `${String(selectedMonth.month).padStart(2, '0')}/${selectedMonth.year}`;

  return (
    <MonthContext.Provider value={{ selectedMonth, setMonth, previousMonth, nextMonth, goToCurrentMonth, monthLabel }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonth must be used within a MonthProvider');
  }
  return context;
}
