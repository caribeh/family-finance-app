const { body } = require('express-validator');
const MealVoucher = require('../models/MealVoucher');
const MealVoucherExpense = require('../models/MealVoucherExpense');
const validate = require('../middleware/validate');

const mealVoucherController = {
  getAll: async (req, res) => {
    const vouchers = await MealVoucher.findByWorkspaceId(req.workspaceId);
    res.json(vouchers.map((v) => ({
      ...v,
      monthly_credit: parseFloat(v.monthly_credit),
      available_balance: parseFloat(v.available_balance),
    })));
  },

  create: [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('monthly_credit').isFloat({ min: 0.01 }).withMessage('Monthly credit must be positive'),
    body('credit_date').isISO8601().withMessage('Credit date must be valid'),
    validate,
    async (req, res) => {
      const { description, monthly_credit: monthlyCredit, credit_date: creditDate } = req.body;
      const voucher = await MealVoucher.create({
        workspaceId: req.workspaceId,
        description,
        monthlyCredit,
        creditDate,
      });
      res.status(201).json({
        ...voucher,
        monthly_credit: parseFloat(voucher.monthly_credit),
        available_balance: parseFloat(voucher.available_balance),
      });
    },
  ],

  addCredit: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('credit_date').isISO8601().withMessage('Credit date must be valid'),
    validate,
    async (req, res) => {
      const voucher = await MealVoucher.findById(req.params.id);
      if (!voucher || voucher.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Meal voucher not found' });
      }
      const { amount } = req.body;
      const updated = await MealVoucher.addCredit(req.params.id, amount);
      res.json({
        ...updated,
        monthly_credit: parseFloat(updated.monthly_credit),
        available_balance: parseFloat(updated.available_balance),
      });
    },
  ],

  addExpense: [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('establishment').optional().trim(),
    body('expense_date').isISO8601().withMessage('Expense date must be valid'),
    validate,
    async (req, res) => {
      const voucher = await MealVoucher.findById(req.params.id);
      if (!voucher || voucher.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Meal voucher not found' });
      }

      const { description, amount, establishment, expense_date: expenseDate } = req.body;

      try {
        await MealVoucher.reduceBalance(req.params.id, amount);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }

      const expense = await MealVoucherExpense.create({
        mealVoucherId: req.params.id,
        workspaceId: req.workspaceId,
        description,
        amount,
        establishment,
        expenseDate,
      });

      const updatedVoucher = await MealVoucher.findById(req.params.id);

      res.status(201).json({
        ...expense,
        amount: parseFloat(expense.amount),
        available_balance: parseFloat(updatedVoucher.available_balance),
      });
    },
  ],

  delete: async (req, res) => {
    const voucher = await MealVoucher.findById(req.params.id);
    if (!voucher || voucher.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Meal voucher not found' });
    }
    await MealVoucher.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = mealVoucherController;
