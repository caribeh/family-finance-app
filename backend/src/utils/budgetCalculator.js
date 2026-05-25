const { getWeekNumber, getDaysRemainingInMonth, getMonthStart, getMonthEnd } = require('./dateHelpers');

function calculateRemainingBudget(limit, spent) {
  return limit - spent;
}

function calculateProjectedBalance({
  totalIncome,
  totalFixedExpenses,
  totalDailyExpenses,
  totalCreditCardInstallments,
  totalDebtInstallments,
  weeklyBudgetLimit,
  daysRemaining,
}) {
  const weeksRemaining = Math.ceil(daysRemaining / 7);
  const projectedBudgetSpending = weeksRemaining * weeklyBudgetLimit;

  return (
    totalIncome -
    totalFixedExpenses -
    totalDailyExpenses -
    totalCreditCardInstallments -
    totalDebtInstallments -
    projectedBudgetSpending
  );
}

function calculateWeeklySpending(dailyExpenses, weekNumber, year) {
  return dailyExpenses
    .filter((expense) => {
      const expenseDate = new Date(expense.expense_date);
      return (
        getWeekNumber(expenseDate) === weekNumber &&
        expenseDate.getFullYear() === year &&
        expense.payment_method !== 'meal_voucher'
      );
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
}

module.exports = {
  calculateRemainingBudget,
  calculateProjectedBalance,
  calculateWeeklySpending,
};
