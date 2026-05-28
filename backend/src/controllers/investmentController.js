const { body } = require('express-validator');
const Investment = require('../models/Investment');
const BankAccount = require('../models/BankAccount');
const DailyControl = require('../models/DailyControl');
const validate = require('../middleware/validate');

const investmentController = {
  getAll: async (req, res) => {
    const investments = await Investment.findByWorkspaceId(req.workspaceId);
    res.json(investments.map((inv) => ({
      ...inv,
      applied_amount: parseFloat(inv.applied_amount),
      current_value: parseFloat(inv.current_value),
    })));
  },

  create: [
    body('type').trim().notEmpty().withMessage('Type is required'),
    body('institution').optional().trim(),
    body('applied_amount').isFloat({ min: 0.01 }).withMessage('Applied amount must be positive'),
    body('application_date').isISO8601().withMessage('Application date must be valid'),
    body('bank_account_id').optional({ nullable: true }).isUUID().withMessage('Invalid bank account'),
    validate,
    async (req, res) => {
      const { type, institution, applied_amount: appliedAmount, application_date: applicationDate, bank_account_id: bankAccountId } = req.body;

      if (bankAccountId) {
        const account = await BankAccount.findById(bankAccountId);
        if (!account || account.workspace_id !== req.workspaceId) {
          return res.status(404).json({ error: 'Bank account not found' });
        }
        if (parseFloat(account.balance) < appliedAmount) {
          return res.status(400).json({ error: 'Insufficient balance in bank account' });
        }
      }

      const investment = await Investment.create({
        workspaceId: req.workspaceId,
        type,
        institution,
        appliedAmount,
        applicationDate,
        bankAccountId,
      });

      if (bankAccountId) {
        await BankAccount.updateBalance(bankAccountId, -appliedAmount);
        await DailyControl.create({
          workspaceId: req.workspaceId,
          type: 'debit',
          description: `Investimento - ${type}${institution ? ` - ${institution}` : ''}`,
          amount: appliedAmount,
          date: applicationDate,
          paymentMethod: 'pix',
          bankAccountId,
          category: 'Investimento',
          source: 'investment',
        });
      }

      res.status(201).json({
        ...investment,
        applied_amount: parseFloat(investment.applied_amount),
        current_value: parseFloat(investment.current_value),
      });
    },
  ],

  apply: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('date').optional().isISO8601().withMessage('Invalid date'),
    validate,
    async (req, res) => {
      const existing = await Investment.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Investment not found' });
      }
      if (existing.status === 'closed') {
        return res.status(400).json({ error: 'Investment already closed' });
      }
      if (!existing.bank_account_id) {
        return res.status(400).json({ error: 'Investment has no linked bank account' });
      }

      const amount = parseFloat(req.body.amount);
      const date = req.body.date || new Date().toISOString().split('T')[0];

      const account = await BankAccount.findById(existing.bank_account_id);
      if (!account || account.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Linked bank account not found' });
      }
      if (parseFloat(account.balance) < amount) {
        return res.status(400).json({ error: 'Insufficient balance in linked bank account' });
      }

      const newCurrentValue = parseFloat(existing.current_value) + amount;
      const newAppliedAmount = parseFloat(existing.applied_amount) + amount;

      await BankAccount.updateBalance(existing.bank_account_id, -amount);
      await DailyControl.create({
        workspaceId: req.workspaceId,
        type: 'debit',
        description: `Aplicacao - ${existing.type}${existing.institution ? ` - ${existing.institution}` : ''}`,
        amount,
        date,
        paymentMethod: 'pix',
        bankAccountId: existing.bank_account_id,
        category: 'Investimento',
        source: 'investment',
      });

      const updated = await Investment.update(req.params.id, { currentValue: newCurrentValue, appliedAmount: newAppliedAmount });

      res.json({
        ...updated,
        applied_amount: parseFloat(updated.applied_amount),
        current_value: parseFloat(updated.current_value),
        applied_amount_added: amount,
      });
    },
  ],

  redeem: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Redeem amount must be positive'),
    body('date').optional().isISO8601().withMessage('Invalid date'),
    validate,
    async (req, res) => {
      const existing = await Investment.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Investment not found' });
      }
      if (existing.status === 'closed') {
        return res.status(400).json({ error: 'Investment already closed' });
      }
      if (!existing.bank_account_id) {
        return res.status(400).json({ error: 'Investment has no linked bank account' });
      }

      const redeemAmount = parseFloat(req.body.amount);
      const currentValue = parseFloat(existing.current_value);
      if (redeemAmount > currentValue) {
        return res.status(400).json({ error: 'Redeem amount exceeds current value' });
      }

      const date = req.body.date || new Date().toISOString().split('T')[0];
      const newCurrentValue = currentValue - redeemAmount;
      const newAppliedAmount = Math.max(0, parseFloat(existing.applied_amount) - redeemAmount);
      const newStatus = newCurrentValue <= 0 ? 'closed' : existing.status;

      if (newCurrentValue <= 0) {
        await BankAccount.updateBalance(existing.bank_account_id, redeemAmount);
        await DailyControl.create({
          workspaceId: req.workspaceId,
          type: 'credit',
          description: `Resgate total - ${existing.type}${existing.institution ? ` - ${existing.institution}` : ''}`,
          amount: redeemAmount,
          date,
          paymentMethod: 'pix',
          bankAccountId: existing.bank_account_id,
          category: 'Investimento',
          source: 'investment',
        });
        await Investment.delete(req.params.id);
        return res.json({ message: 'Investment fully redeemed and deleted', redeemed_amount: redeemAmount });
      }

      await BankAccount.updateBalance(existing.bank_account_id, redeemAmount);
      await DailyControl.create({
        workspaceId: req.workspaceId,
        type: 'credit',
        description: `Resgate - ${existing.type}${existing.institution ? ` - ${existing.institution}` : ''}`,
        amount: redeemAmount,
        date,
        paymentMethod: 'pix',
        bankAccountId: existing.bank_account_id,
        category: 'Investimento',
        source: 'investment',
      });

      await Investment.update(req.params.id, { currentValue: newCurrentValue, status: newStatus, appliedAmount: newAppliedAmount });

      const updated = await Investment.findById(req.params.id);
      res.json({
        ...updated,
        applied_amount: parseFloat(updated.applied_amount),
        current_value: parseFloat(updated.current_value),
        redeemed_amount: redeemAmount,
      });
    },
  ],

  update: [
    body('current_value').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'closed']),
    validate,
    async (req, res) => {
      const existing = await Investment.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Investment not found' });
      }
      const { current_value: currentValue, status } = req.body;
      const investment = await Investment.update(req.params.id, {
        currentValue: currentValue !== undefined ? currentValue : existing.current_value,
        status: status || existing.status,
      });
      res.json({
        ...investment,
        applied_amount: parseFloat(investment.applied_amount),
        current_value: parseFloat(investment.current_value),
      });
    },
  ],

  delete: async (req, res) => {
    const existing = await Investment.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    await Investment.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = investmentController;
