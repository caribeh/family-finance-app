const { body } = require('express-validator');
const DailyExpense = require('../models/DailyExpense');
const CreditCard = require('../models/CreditCard');
const CreditCardExpense = require('../models/CreditCardExpense');
const MealVoucher = require('../models/MealVoucher');
const MealVoucherExpense = require('../models/MealVoucherExpense');
const { getWeekNumber, getMonthStart, getMonthEnd } = require('../utils/dateHelpers');
const validate = require('../middleware/validate');

const dailyExpenseController = {
  getAll: async (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'month and year query parameters are required' });
    }
    const expenses = await DailyExpense.findByWorkspaceIdAndMonth(req.workspaceId, parseInt(month), parseInt(year));
    res.json(expenses.map((e) => ({
      ...e,
      amount: parseFloat(e.amount),
    })));
  },

  create: [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('expense_date').isISO8601().withMessage('Expense date must be valid'),
    body('payment_method').isIn(['cash', 'credit_card', 'meal_voucher']).withMessage('Payment method must be cash, credit_card, or meal_voucher'),
    body('paid_by').isIn(['user', 'wife']).withMessage('Paid by must be user or wife'),
    body('category').optional().trim(),
    body('credit_card_id').optional({ nullable: true }).isUUID().withMessage('Credit card ID must be valid'),
    body('meal_voucher_id').optional({ nullable: true }).isUUID().withMessage('Meal voucher ID must be valid'),
    validate,
    async (req, res) => {
      const { description, amount, expense_date: expenseDate, payment_method: paymentMethod, paid_by: paidBy, category, credit_card_id: creditCardId, meal_voucher_id: mealVoucherId } = req.body;

      if (paymentMethod === 'credit_card' && !creditCardId) {
        return res.status(400).json({ error: 'credit_card_id is required when payment_method is credit_card' });
      }
      if (paymentMethod === 'meal_voucher' && !mealVoucherId) {
        return res.status(400).json({ error: 'meal_voucher_id is required when payment_method is meal_voucher' });
      }

      if (paymentMethod === 'credit_card') {
        const card = await CreditCard.findById(creditCardId);
        if (!card || card.workspace_id !== req.workspaceId) {
          return res.status(404).json({ error: 'Credit card not found' });
        }
        if (parseFloat(card.available_limit) < amount) {
          return res.status(400).json({ error: 'Insufficient credit limit' });
        }

        await CreditCard.updateAvailableLimit(creditCardId, amount);
        await CreditCardExpense.create({
          creditCardId,
          workspaceId: req.workspaceId,
          description,
          totalAmount: amount,
          installmentAmount: amount,
          totalInstallments: 1,
          establishment: category,
          purchaseDate: expenseDate,
        });
      }

      if (paymentMethod === 'meal_voucher') {
        const voucher = await MealVoucher.findById(mealVoucherId);
        if (!voucher || voucher.workspace_id !== req.workspaceId) {
          return res.status(404).json({ error: 'Meal voucher not found' });
        }
        try {
          await MealVoucher.reduceBalance(mealVoucherId, amount);
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }

        await MealVoucherExpense.create({
          mealVoucherId,
          workspaceId: req.workspaceId,
          description,
          amount,
          establishment: category,
          expenseDate,
        });
      }

      const expense = await DailyExpense.create({
        workspaceId: req.workspaceId,
        description,
        amount,
        expenseDate,
        paymentMethod,
        creditCardId,
        mealVoucherId,
        paidBy,
        category,
      });

      res.status(201).json({ ...expense, amount: parseFloat(expense.amount) });
    },
  ],

  update: [
    body('description').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('expense_date').optional().isISO8601(),
    body('payment_method').optional().isIn(['cash', 'credit_card', 'meal_voucher']),
    body('paid_by').optional().isIn(['user', 'wife']),
    body('category').optional().trim(),
    body('credit_card_id').optional({ nullable: true }).isUUID(),
    body('meal_voucher_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const existing = await DailyExpense.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Daily expense not found' });
      }

      const { description, amount, expense_date: expenseDate, payment_method: paymentMethod, paid_by: paidBy, category, credit_card_id: creditCardId, meal_voucher_id: mealVoucherId } = req.body;

      const expense = await DailyExpense.update(req.params.id, {
        description: description || existing.description,
        amount: amount || existing.amount,
        expenseDate: expenseDate || existing.expense_date,
        paymentMethod: paymentMethod || existing.payment_method,
        creditCardId: creditCardId !== undefined ? creditCardId : existing.credit_card_id,
        mealVoucherId: mealVoucherId !== undefined ? mealVoucherId : existing.meal_voucher_id,
        paidBy: paidBy || existing.paid_by,
        category: category !== undefined ? category : existing.category,
      });

      res.json({ ...expense, amount: parseFloat(expense.amount) });
    },
  ],

  delete: async (req, res) => {
    const existing = await DailyExpense.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Daily expense not found' });
    }

    if (existing.payment_method === 'credit_card' && existing.credit_card_id) {
      await CreditCard.updateAvailableLimit(existing.credit_card_id, -parseFloat(existing.amount));
    }

    if (existing.payment_method === 'meal_voucher' && existing.meal_voucher_id) {
      await MealVoucher.addCredit(existing.meal_voucher_id, parseFloat(existing.amount));
    }

    await DailyExpense.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = dailyExpenseController;
