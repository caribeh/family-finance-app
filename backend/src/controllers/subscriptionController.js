const { body } = require('express-validator');
const Subscription = require('../models/Subscription');
const DailyControl = require('../models/DailyControl');
const CreditCard = require('../models/CreditCard');
const validate = require('../middleware/validate');

const subscriptionController = {
  getAll: async (req, res) => {
    const subscriptions = await Subscription.findByWorkspaceId(req.workspaceId);
    res.json(subscriptions.map((s) => ({
      ...s,
      amount: parseFloat(s.amount),
    })));
  },

  create: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('billing_day').isInt({ min: 1, max: 31 }).withMessage('Billing day must be 1-31'),
    body('credit_card_id').isUUID().withMessage('Credit card is required'),
    validate,
    async (req, res) => {
      const { name, amount, billing_day: billingDay, credit_card_id: creditCardId } = req.body;

      const card = await CreditCard.findById(creditCardId);
      if (!card || card.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Credit card not found' });
      }

      const subscription = await Subscription.create({
        workspaceId: req.workspaceId,
        name,
        amount,
        billingDay,
        creditCardId,
      });

      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      for (let i = 0; i < 12; i++) {
        const entryDate = new Date(currentYear, currentMonth - 1 + i, billingDay);
        const entryDateStr = entryDate.toISOString().split('T')[0];
        await DailyControl.create({
          workspaceId: req.workspaceId,
          memberId: null,
          type: 'debit',
          description: `Assinatura ${name}`,
          amount,
          date: entryDateStr,
          paymentMethod: 'credit_card',
          bankAccountId: null,
          creditCardId,
          mealVoucherId: null,
          category: 'Assinatura',
          source: 'subscription',
        });
      }

      res.status(201).json({
        ...subscription,
        amount: parseFloat(subscription.amount),
      });
    },
  ],

  cancel: async (req, res) => {
    const existing = await Subscription.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    if (!existing.is_active) {
      return res.status(400).json({ error: 'Subscription already cancelled' });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    await DailyControl.deleteBySourceAndFutureDate(req.workspaceId, 'subscription', `Assinatura ${existing.name}`, todayStr);

    const cancelled = await Subscription.cancel(req.params.id);

    res.json({
      ...cancelled,
      amount: parseFloat(cancelled.amount),
    });
  },

  delete: async (req, res) => {
    const existing = await Subscription.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    await Subscription.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = subscriptionController;
