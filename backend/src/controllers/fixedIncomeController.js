const { body, query } = require('express-validator');
const FixedIncome = require('../models/FixedIncome');
const validate = require('../middleware/validate');

const fixedIncomeController = {
  getAll: [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2000, max: 2100 }),
    validate,
    async (req, res) => {
      const incomes = await FixedIncome.findByWorkspaceId(req.workspaceId);
      res.json(incomes.map((inc) => ({
        ...inc,
        amount: parseFloat(inc.amount),
      })));
    },
  ],

  create: [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('due_day').isInt({ min: 1, max: 31 }).withMessage('Due day must be between 1 and 31'),
    body('bank_account_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const { description, amount, due_day: dueDay, bank_account_id: bankAccountId } = req.body;
      const income = await FixedIncome.create({
        workspaceId: req.workspaceId,
        description,
        amount,
        dueDay,
        bankAccountId,
      });
      res.status(201).json({ ...income, amount: parseFloat(income.amount) });
    },
  ],

  update: [
    body('description').optional().trim().notEmpty(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('due_day').optional().isInt({ min: 1, max: 31 }),
    body('bank_account_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const existing = await FixedIncome.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Fixed income not found' });
      }
      const { description, amount, due_day: dueDay, bank_account_id: bankAccountId } = req.body;
      const income = await FixedIncome.update(req.params.id, {
        description: description || existing.description,
        amount: amount || existing.amount,
        dueDay: dueDay || existing.due_day,
        bankAccountId: bankAccountId !== undefined ? bankAccountId : existing.bank_account_id,
      });
      res.json({ ...income, amount: parseFloat(income.amount) });
    },
  ],

  delete: async (req, res) => {
    const existing = await FixedIncome.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Fixed income not found' });
    }
    await FixedIncome.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = fixedIncomeController;
