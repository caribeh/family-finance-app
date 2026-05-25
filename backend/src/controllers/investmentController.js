const { body } = require('express-validator');
const Investment = require('../models/Investment');
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
    validate,
    async (req, res) => {
      const { type, institution, applied_amount: appliedAmount, application_date: applicationDate } = req.body;

      const investment = await Investment.create({
        workspaceId: req.workspaceId,
        type,
        institution,
        appliedAmount,
        applicationDate,
      });

      res.status(201).json({
        ...investment,
        applied_amount: parseFloat(investment.applied_amount),
        current_value: parseFloat(investment.current_value),
      });
    },
  ],

  redeem: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Redeem amount must be positive'),
    validate,
    async (req, res) => {
      const existing = await Investment.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Investment not found' });
      }
      if (existing.status === 'closed') {
        return res.status(400).json({ error: 'Investment already closed' });
      }

      const redeemAmount = parseFloat(req.body.amount);
      const currentValue = parseFloat(existing.current_value);
      if (redeemAmount > currentValue) {
        return res.status(400).json({ error: 'Redeem amount exceeds current value' });
      }

      const newCurrentValue = currentValue - redeemAmount;
      const newStatus = newCurrentValue <= 0 ? 'closed' : existing.status;
      await Investment.update(req.params.id, { currentValue: newCurrentValue, status: newStatus });

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
