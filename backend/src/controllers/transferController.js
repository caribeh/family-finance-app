const { body } = require('express-validator');
const Transfer = require('../models/Transfer');
const BankAccount = require('../models/BankAccount');
const validate = require('../middleware/validate');

const transferController = {
  create: [
    body('source_account_id').isUUID().withMessage('Source account is required'),
    body('target_account_id').isUUID().withMessage('Target account is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
    body('date').optional().isISO8601().withMessage('Invalid date'),
    body('description').optional().trim().isLength({ max: 100 }),
    validate,
    async (req, res) => {
      const { source_account_id, target_account_id, amount, date, description } = req.body;

      if (source_account_id === target_account_id) {
        return res.status(400).json({ error: 'Source and target accounts must be different' });
      }

      const source = await BankAccount.findById(source_account_id);
      if (!source || source.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Source account not found' });
      }

      const target = await BankAccount.findById(target_account_id);
      if (!target || target.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Target account not found' });
      }

      const result = await Transfer.create({
        workspaceId: req.workspaceId,
        sourceAccountId: source_account_id,
        targetAccountId: target_account_id,
        amount,
        date: date || new Date().toISOString().split('T')[0],
        description: description || '',
      });

      res.status(201).json(result);
    },
  ],
};

module.exports = transferController;
