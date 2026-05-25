const { body } = require('express-validator');
const FixedExpense = require('../models/FixedExpense');
const BankAccount = require('../models/BankAccount');
const validate = require('../middleware/validate');

const fixedExpenseController = {
  getAll: async (req, res) => {
    const expenses = await FixedExpense.findByWorkspaceId(req.workspaceId);
    res.json(expenses.map((exp) => ({
      ...exp,
      amount: parseFloat(exp.amount),
    })));
  },

  create: [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('due_day').isInt({ min: 1, max: 31 }).withMessage('Due day must be between 1 and 31'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('payment_method').optional().isIn(['cash', 'credit_card', 'meal_voucher', 'pix', 'debit']),
    body('credit_card_id').optional({ nullable: true }).isUUID(),
    body('bank_account_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const { description, amount, due_day: dueDay, category, payment_method: paymentMethod, credit_card_id: creditCardId, bank_account_id: bankAccountId } = req.body;
      const expense = await FixedExpense.create({
        workspaceId: req.workspaceId,
        description,
        amount,
        dueDay,
        category,
        paymentMethod: paymentMethod || 'cash',
        creditCardId,
        bankAccountId,
      });
      res.status(201).json({ ...expense, amount: parseFloat(expense.amount) });
    },
  ],

  update: [
    body('description').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('due_day').optional().isInt({ min: 1, max: 31 }),
    body('category').optional().trim().notEmpty(),
    body('payment_method').optional().isIn(['cash', 'credit_card', 'meal_voucher', 'pix', 'debit']),
    body('credit_card_id').optional({ nullable: true }).isUUID(),
    body('bank_account_id').optional({ nullable: true }).isUUID(),
    body('is_paid').optional().isBoolean(),
    validate,
    async (req, res) => {
      const existing = await FixedExpense.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Fixed expense not found' });
      }
      const { description, amount, due_day: dueDay, category, payment_method: paymentMethod, credit_card_id: creditCardId, bank_account_id: bankAccountId, is_paid: isPaid } = req.body;
      const expense = await FixedExpense.update(req.params.id, {
        description: description !== undefined ? description : existing.description,
        amount: amount !== undefined ? amount : existing.amount,
        dueDay: dueDay !== undefined ? dueDay : existing.due_day,
        category: category !== undefined ? category : existing.category,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existing.payment_method,
        creditCardId: creditCardId !== undefined ? creditCardId : existing.credit_card_id,
        bankAccountId: bankAccountId !== undefined ? bankAccountId : existing.bank_account_id,
        isPaid: isPaid !== undefined ? isPaid : existing.is_paid,
      });
      res.json({ ...expense, amount: parseFloat(expense.amount) });
    },
  ],

  markPaid: [
    body('bank_account_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const existing = await FixedExpense.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Fixed expense not found' });
      }
      const { bank_account_id: bankAccountId } = req.body;

      if (bankAccountId) {
        const account = await BankAccount.findById(bankAccountId);
        if (!account || account.workspace_id !== req.workspaceId) {
          return res.status(404).json({ error: 'Bank account not found' });
        }
        await BankAccount.updateBalance(bankAccountId, -parseFloat(existing.amount));
      }

      const expense = await FixedExpense.markPaid(req.params.id, bankAccountId);
      res.json({ ...expense, amount: parseFloat(expense.amount) });
    },
  ],

  delete: async (req, res) => {
    const existing = await FixedExpense.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Fixed expense not found' });
    }
    await FixedExpense.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = fixedExpenseController;
