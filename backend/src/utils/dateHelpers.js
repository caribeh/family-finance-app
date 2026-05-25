function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getDaysRemainingInMonth(date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const diff = lastDay - date;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getMonthStart(month, year) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function getMonthEnd(month, year) {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function getWeeksInMonth(month, year) {
  const weeks = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let current = new Date(firstDay);
  while (current <= lastDay) {
    const dayOfWeek = current.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekStart = new Date(Math.max(monday.getTime(), firstDay.getTime()));
    const weekEnd = new Date(Math.min(sunday.getTime(), lastDay.getTime()));

    weeks.push({
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
      weekNumber: getWeekNumber(weekStart),
      label: `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')} a ${String(weekEnd.getDate()).padStart(2, '0')}/${String(weekEnd.getMonth() + 1).padStart(2, '0')}`,
    });

    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

module.exports = {
  getWeekNumber,
  getDaysRemainingInMonth,
  getMonthStart,
  getMonthEnd,
  getWeeksInMonth,
};
