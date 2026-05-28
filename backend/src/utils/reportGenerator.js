const { getMonthStart, getMonthEnd, getDaysRemainingInMonth } = require('./dateHelpers');
const DebtPayment = require('../models/DebtPayment');

async function generateMonthlyReport({
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
  month,
  year,
  workspaceId,
  cancelledSubscriptions,
  benefitCards,
}) {
  const standardCredits = (dailyControlEntries || []).filter((e) => e.type === 'credit' && e.payment_method !== 'benefit_card' && e.source !== 'transfer' && e.source !== 'investment').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalIncome = fixedIncomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0) + standardCredits;

  const totalFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const paidFixedExpenses = fixedExpenses
    .filter((e) => e.is_paid)
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const pendingFixedExpenses = totalFixedExpenses - paidFixedExpenses;

  const standardDebits = (dailyControlEntries || []).filter((e) => e.type === 'debit' && e.payment_method !== 'benefit_card' && e.payment_method !== 'credit_card' && e.source !== 'transfer' && e.source !== 'investment').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalDailyExpenses = dailyExpenses
    .filter((e) => e.payment_method !== 'meal_voucher')
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0) + standardDebits;

  const totalMealVoucherExpenses = mealVoucherExpenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amount),
    0
  );

  const allCCDebits = (dailyControlEntries || [])
    .filter((e) => e.type === 'debit' && e.payment_method === 'credit_card');

  const totalCCThisMonth = allCCDebits.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const installmentCCIds = (creditCardExpenses || [])
    .filter((exp) => exp.total_installments > 1)
    .map((exp) => exp.id);

  const parceladosCCThisMonth = allCCDebits
    .filter((e) => {
      if (e.source === 'subscription') return false;
      if (e.description && /\(\d+\/\d+\)/.test(e.description)) return true;
      return false;
    })
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const cardTotals = {};
  for (const entry of allCCDebits) {
    const cardId = entry.credit_card_id;
    if (!cardId) continue;
    if (!cardTotals[cardId]) {
      cardTotals[cardId] = 0;
    }
    cardTotals[cardId] += parseFloat(entry.amount);
  }

  const creditCardsBreakdown = (creditCards || []).map((card) => ({
    id: card.id,
    name: card.name,
    total: cardTotals[card.id] || 0,
  }));

  const debtPaymentsThisMonth = workspaceId ? await DebtPayment.getTotalByMonth(workspaceId, month, year) : 0;

  const benefitCreditsThisMonth = (dailyControlEntries || [])
    .filter((e) => e.type === 'credit' && e.payment_method === 'benefit_card')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const benefitDebitsThisMonth = (dailyControlEntries || [])
    .filter((e) => e.type === 'debit' && e.payment_method === 'benefit_card')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const projectedBalance = (bankAccounts || []).reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const totalBenefitBalance = (benefitCards || []).reduce((sum, c) => sum + parseFloat(c.balance), 0);

  const totalInvestments = investments.reduce(
    (sum, inv) => sum + parseFloat(inv.current_value || inv.applied_amount),
    0
  );

  const expensesByCategory = {};
  dailyExpenses.forEach((exp) => {
    const cat = exp.category || 'Sem categoria';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + parseFloat(exp.amount);
  });
  (dailyControlEntries || []).filter((e) => e.type === 'debit' && e.payment_method !== 'benefit_card' && e.payment_method !== 'credit_card' && e.source !== 'transfer' && e.source !== 'investment').forEach((exp) => {
    const cat = exp.category || 'Sem categoria';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + parseFloat(exp.amount);
  });

  const benefitEntries = (dailyControlEntries || []).filter((e) => e.payment_method === 'benefit_card');

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    summary: {
      total_income: totalIncome,
      total_expenses: totalDailyExpenses,
      total_credit_card: totalCCThisMonth,
      total_credit_card_installments: parceladosCCThisMonth,
      credit_cards_breakdown: creditCardsBreakdown,
      total_debt_payments: debtPaymentsThisMonth,
      total_investments: totalInvestments,
      total_meal_voucher_expenses: totalMealVoucherExpenses,
      final_balance: totalIncome - totalDailyExpenses - totalCCThisMonth - debtPaymentsThisMonth,
      projected_balance: projectedBalance,
    },
    income_breakdown: fixedIncomes.map((inc) => ({
      description: inc.description,
      amount: parseFloat(inc.amount),
      due_day: inc.due_day,
    })),
    expense_breakdown: fixedExpenses.map((exp) => ({
      description: exp.description,
      amount: parseFloat(exp.amount),
      category: exp.category,
      is_paid: exp.is_paid,
    })),
    category_totals: Object.entries(expensesByCategory).map(([category, total]) => ({
      category,
      total,
    })),
    daily_expenses: dailyExpenses.map((exp) => ({
      id: exp.id,
      description: exp.description,
      amount: parseFloat(exp.amount),
      expense_date: exp.expense_date,
      payment_method: exp.payment_method,
      paid_by: exp.paid_by,
      category: exp.category,
    })),
    credit_card_summary: creditCardExpenses.map((exp) => ({
      id: exp.id,
      description: exp.description,
      total_amount: parseFloat(exp.total_amount),
      installment_amount: parseFloat(exp.installment_amount),
      total_installments: exp.total_installments,
      current_installment: exp.current_installment,
      establishment: exp.establishment,
      purchase_date: exp.purchase_date,
    })),
    meal_voucher_summary: mealVoucherExpenses.map((exp) => ({
      id: exp.id,
      description: exp.description,
      amount: parseFloat(exp.amount),
      establishment: exp.establishment,
      expense_date: exp.expense_date,
    })),
    investment_summary: investments.map((inv) => ({
      id: inv.id,
      type: inv.type,
      institution: inv.institution,
      applied_amount: parseFloat(inv.applied_amount),
      current_value: parseFloat(inv.current_value),
      status: inv.status,
    })),
    observations: (cancelledSubscriptions || []).map((s) => ({
      text: `Assinatura ${s.name} cancelada no dia ${new Date(s.cancelled_at).toLocaleDateString('pt-BR')}`,
    })),
    benefit_summary: {
      total_credits: benefitCreditsThisMonth,
      total_debits: benefitDebitsThisMonth,
      total_balance: totalBenefitBalance,
      cards: (benefitCards || []).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        balance: parseFloat(c.balance),
      })),
      entries: benefitEntries.map((e) => ({
        id: e.id,
        type: e.type,
        description: e.description,
        amount: parseFloat(e.amount),
        date: e.date,
        category: e.category,
      })),
    },
  };
}

module.exports = { generateMonthlyReport };
