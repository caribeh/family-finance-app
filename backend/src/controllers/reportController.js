const FixedIncome = require('../models/FixedIncome');
const FixedExpense = require('../models/FixedExpense');
const DailyExpense = require('../models/DailyExpense');
const DailyControl = require('../models/DailyControl');
const CreditCard = require('../models/CreditCard');
const CreditCardExpense = require('../models/CreditCardExpense');
const MealVoucherExpense = require('../models/MealVoucherExpense');
const MealVoucher = require('../models/MealVoucher');
const Debt = require('../models/Debt');
const DebtPayment = require('../models/DebtPayment');
const Investment = require('../models/Investment');
const Subscription = require('../models/Subscription');
const BenefitCard = require('../models/BenefitCard');
const BankAccount = require('../models/BankAccount');
const Member = require('../models/Member');
const { getWeekNumber, getDaysRemainingInMonth, getWeeksInMonth } = require('../utils/dateHelpers');
const { calculateWeeklySpending, calculateRemainingBudget, calculateProjectedBalance } = require('../utils/budgetCalculator');
const { generateMonthlyReport } = require('../utils/reportGenerator');

const reportController = {
  getDashboard: async (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'month and year query parameters are required' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    const workspaceMembers = await Member.findByWorkspaceId(req.workspaceId);

    const membersBudgets = [];
    for (const member of workspaceMembers) {
      const limit = parseFloat(member.monthly_budget_limit);
      const monthlySpentDaily = await DailyExpense.getTotalSpentByMonth(req.workspaceId, m, y);
      const monthlySpentControl = await DailyControl.getTotalByTypeAndMonthForMember(member.id, m, y);
      const monthlySpent = monthlySpentDaily + monthlySpentControl;
      const remaining = calculateRemainingBudget(limit, monthlySpent);
      membersBudgets.push({
        id: member.id,
        name: member.name,
        display_role: member.display_role,
        limit_amount: limit,
        spent: monthlySpent,
        remaining,
      });
    }

    const fixedIncomes = await FixedIncome.findByWorkspaceId(req.workspaceId);
    const fixedExpenses = await FixedExpense.findByWorkspaceId(req.workspaceId);
    const dailyExpenses = await DailyExpense.findByWorkspaceIdAndMonth(req.workspaceId, m, y);
    const dailyControlEntries = await DailyControl.findByWorkspaceIdAndMonth(req.workspaceId, m, y);
    const creditCardExpenses = await CreditCardExpense.findByWorkspaceIdAndMonth(req.workspaceId, m, y);
    const mealVoucherExpenses = await MealVoucherExpense.findByWorkspaceIdAndMonth(req.workspaceId, m, y);
    const debts = await Debt.findByWorkspaceId(req.workspaceId);
    const investments = await Investment.findByWorkspaceId(req.workspaceId);
    const bankAccounts = await BankAccount.findByWorkspaceId(req.workspaceId);
    const mealVouchers = await MealVoucher.findByWorkspaceId(req.workspaceId);
    const benefitCards = await BenefitCard.findByWorkspaceId(req.workspaceId);

    const standardCredits = dailyControlEntries.filter((e) => e.type === 'credit' && e.payment_method !== 'benefit_card').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalIncome = fixedIncomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0) + standardCredits;
    const totalFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const paidFixedExpenses = fixedExpenses.filter((e) => e.is_paid).reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const pendingFixedExpenses = totalFixedExpenses - paidFixedExpenses;

    const standardDebits = dailyControlEntries.filter((e) => e.type === 'debit' && e.payment_method !== 'benefit_card' && e.payment_method !== 'credit_card').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalDailyExpenses = dailyExpenses
      .filter((e) => e.payment_method !== 'meal_voucher')
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0) + standardDebits;

    const totalCreditCardExpenses = dailyControlEntries
      .filter((e) => e.type === 'debit' && e.payment_method === 'credit_card')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalMealVoucherExpenses = mealVoucherExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    const benefitCreditsThisMonth = dailyControlEntries
      .filter((e) => e.type === 'credit' && e.payment_method === 'benefit_card')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const benefitDebitsThisMonth = dailyControlEntries
      .filter((e) => e.type === 'debit' && e.payment_method === 'benefit_card')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalBenefitBalance = benefitCards.reduce((sum, c) => sum + parseFloat(c.balance), 0);

    const creditCardInstallmentsThisMonth = creditCardExpenses.reduce((sum, exp) => {
      const purchaseDate = new Date(exp.purchase_date);
      const monthsSince = (y - purchaseDate.getFullYear()) * 12 + (m - purchaseDate.getMonth() - 1);
      const installmentDue = exp.current_installment + monthsSince;
      if (installmentDue >= 1 && installmentDue <= exp.total_installments) {
        return sum + parseFloat(exp.installment_amount);
      }
      return sum;
    }, 0);

    const debtPaymentsThisMonth = await DebtPayment.getTotalByMonth(req.workspaceId, m, y);

    const projectedBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const totalMealVoucherBalance = mealVouchers.reduce((sum, v) => sum + parseFloat(v.available_balance), 0);

    const expensesByCategory = {};
    dailyExpenses.forEach((exp) => {
      const cat = exp.category || 'Sem categoria';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + parseFloat(exp.amount);
    });
    dailyControlEntries.filter((e) => e.type === 'debit').forEach((exp) => {
      const cat = exp.category || 'Sem categoria';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + parseFloat(exp.amount);
    });

    res.json({
      month: `${y}-${String(m).padStart(2, '0')}`,
      total_income: totalIncome,
      total_fixed_expenses: totalFixedExpenses,
      paid_fixed_expenses: paidFixedExpenses,
      pending_fixed_expenses: pendingFixedExpenses,
      total_daily_expenses: totalDailyExpenses,
      total_credit_card_expenses: totalCreditCardExpenses,
      total_meal_voucher_expenses: totalMealVoucherExpenses,
      total_meal_voucher_balance: totalMealVoucherBalance,
      benefit_credits: benefitCreditsThisMonth,
      benefit_debits: benefitDebitsThisMonth,
      total_benefit_balance: totalBenefitBalance,
      members_budgets: membersBudgets,
      projected_balance: projectedBalance,
      expenses_by_category: Object.entries(expensesByCategory).map(([category, total]) => ({
        category,
        total,
      })),
    });
  },

  getMonthlyReport: async (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'month and year query parameters are required' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    const fixedIncomes = await FixedIncome.findByWorkspaceId(req.workspaceId);
    const fixedExpenses = await FixedExpense.findByWorkspaceId(req.workspaceId);
    const dailyExpenses = await DailyExpense.findByWorkspaceIdAndMonth(req.workspaceId, m, y);
    const dailyControlEntries = await DailyControl.findByWorkspaceIdAndMonth(req.workspaceId, m, y);
    const creditCardExpenses = await CreditCardExpense.findActiveByMonth(req.workspaceId, m, y);
    const mealVoucherExpenses = await MealVoucherExpense.findByWorkspaceIdAndMonth(req.workspaceId, m, y);
    const debts = await Debt.findByWorkspaceId(req.workspaceId);
    const investments = await Investment.findByWorkspaceId(req.workspaceId);
    const bankAccounts = await BankAccount.findByWorkspaceId(req.workspaceId);
    const cancelledSubscriptions = await Subscription.getCancelledThisMonth(req.workspaceId, m, y);
    const benefitCards = await BenefitCard.findByWorkspaceId(req.workspaceId);
    const creditCards = await CreditCard.findByWorkspaceId(req.workspaceId);

    const report = await generateMonthlyReport({
      fixedIncomes,
      fixedExpenses,
      dailyExpenses,
      dailyControlEntries,
      creditCardExpenses,
      mealVoucherExpenses,
      debts,
      investments,
      bankAccounts,
      creditCards,
      month: m,
      year: y,
      workspaceId: req.workspaceId,
      cancelledSubscriptions,
      benefitCards,
    });

    res.json(report);
  },
};

module.exports = reportController;
