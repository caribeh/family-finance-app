const { body } = require('express-validator');
const BankAccount = require('../models/BankAccount');
const validate = require('../middleware/validate');

const bankAccountController = {
  getAll: async (req, res) => {
    const accounts = await BankAccount.findByWorkspaceId(req.workspaceId);
    res.json(accounts.map((a) => ({
      ...a,
      balance: parseFloat(a.balance),
    })));
  },

  create: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('bank_name').optional().trim(),
    body('account_type').optional().isIn(['checking', 'savings']),
    body('balance').optional().isFloat(),
    body('member_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const { name, bank_name: bankName, account_type: accountType, balance, member_id: memberId } = req.body;
      const account = await BankAccount.create({
        workspaceId: req.workspaceId,
        memberId,
        name,
        bankName,
        accountType: accountType || 'checking',
        balance: balance || 0,
      });
      res.status(201).json({ ...account, balance: parseFloat(account.balance) });
    },
  ],

  update: [
    body('name').optional().trim().notEmpty(),
    body('bank_name').optional().trim(),
    body('account_type').optional().isIn(['checking', 'savings']),
    body('balance').optional().isFloat(),
    validate,
    async (req, res) => {
      const existing = await BankAccount.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Bank account not found' });
      }
      const { name, bank_name: bankName, account_type: accountType, balance } = req.body;
      const account = await BankAccount.update(req.params.id, {
        name: name !== undefined ? name : existing.name,
        bankName: bankName !== undefined ? bankName : existing.bank_name,
        accountType: accountType || existing.account_type,
        balance: balance !== undefined ? balance : existing.balance,
      });
      res.json({ ...account, balance: parseFloat(account.balance) });
    },
  ],

  delete: async (req, res) => {
    const existing = await BankAccount.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    await BankAccount.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = bankAccountController;
