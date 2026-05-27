require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const fixedIncomeRoutes = require('./routes/fixedIncome.routes');
const fixedExpenseRoutes = require('./routes/fixedExpense.routes');
const weeklyBudgetRoutes = require('./routes/weeklyBudget.routes');
const debtRoutes = require('./routes/debt.routes');
const creditCardRoutes = require('./routes/creditCard.routes');
const mealVoucherRoutes = require('./routes/mealVoucher.routes');
const dailyExpenseRoutes = require('./routes/dailyExpense.routes');
const dailyControlRoutes = require('./routes/dailyControl.routes');
const bankAccountRoutes = require('./routes/bankAccount.routes');
const investmentRoutes = require('./routes/investment.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const benefitCardRoutes = require('./routes/benefitCard.routes');
const reportRoutes = require('./routes/report.routes');
const dataRoutes = require('./routes/data.routes');
const billReminderRoutes = require('./routes/billReminder.routes');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fixed-incomes', fixedIncomeRoutes);
app.use('/api/fixed-expenses', fixedExpenseRoutes);
app.use('/api/weekly-budget', weeklyBudgetRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/meal-vouchers', mealVoucherRoutes);
app.use('/api/daily-expenses', dailyExpenseRoutes);
app.use('/api/daily-control', dailyControlRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/benefit-cards', benefitCardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/bill-reminders', billReminderRoutes);

app.use(errorHandler);

module.exports = app;
