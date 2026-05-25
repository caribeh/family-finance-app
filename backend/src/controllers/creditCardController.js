const { body } = require('express-validator');
const CreditCard = require('../models/CreditCard');
const CreditCardExpense = require('../models/CreditCardExpense');
const validate = require('../middleware/validate');

const creditCardController = {
  getAll: async (req, res) => {
    const cards = await CreditCard.findByWorkspaceId(req.workspaceId);
    res.json(cards.map((c) => ({
      ...c,
      credit_limit: parseFloat(c.credit_limit),
      available_limit: parseFloat(c.available_limit),
    })));
  },

  create: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('brand').optional().trim(),
    body('credit_limit').isFloat({ min: 0.01 }).withMessage('Credit limit must be positive'),
    body('closing_day').isInt({ min: 1, max: 31 }).withMessage('Closing day must be between 1 and 31'),
    body('due_day').isInt({ min: 1, max: 31 }).withMessage('Due day must be between 1 and 31'),
    validate,
    async (req, res) => {
      const { name, brand, credit_limit: creditLimit, closing_day: closingDay, due_day: dueDay } = req.body;
      const card = await CreditCard.create({
        workspaceId: req.workspaceId,
        name,
        brand,
        creditLimit,
        closingDay,
        dueDay,
      });
      res.status(201).json({
        ...card,
        credit_limit: parseFloat(card.credit_limit),
        available_limit: parseFloat(card.available_limit),
      });
    },
  ],

  getInvoice: async (req, res) => {
    const card = await CreditCard.findById(req.params.id);
    if (!card || card.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Credit card not found' });
    }
    const expenses = await CreditCardExpense.findByCardId(req.params.id);
    const totalCurrent = expenses.reduce((sum, exp) => sum + parseFloat(exp.total_amount), 0);
    res.json({
      card: {
        ...card,
        credit_limit: parseFloat(card.credit_limit),
        available_limit: parseFloat(card.available_limit),
      },
      expenses: expenses.map((e) => ({
        ...e,
        total_amount: parseFloat(e.total_amount),
        installment_amount: parseFloat(e.installment_amount),
      })),
      total_current: totalCurrent,
      available_limit: parseFloat(card.available_limit),
    });
  },

  addExpense: [
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('total_amount').isFloat({ min: 0.01 }).withMessage('Total amount must be positive'),
    body('total_installments').optional().isInt({ min: 1 }).withMessage('Installments must be at least 1'),
    body('establishment').optional().trim(),
    body('purchase_date').isISO8601().withMessage('Purchase date must be valid'),
    validate,
    async (req, res) => {
      const card = await CreditCard.findById(req.params.id);
      if (!card || card.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Credit card not found' });
      }

      const { description, total_amount: totalAmount, total_installments: totalInstallments = 1, establishment, purchase_date: purchaseDate } = req.body;
      const installmentAmount = totalAmount / totalInstallments;

      if (parseFloat(card.available_limit) < totalAmount) {
        return res.status(400).json({ error: 'Insufficient credit limit' });
      }

      const expense = await CreditCardExpense.create({
        creditCardId: req.params.id,
        workspaceId: req.workspaceId,
        description,
        totalAmount,
        installmentAmount,
        totalInstallments,
        establishment,
        purchaseDate,
      });

      await CreditCard.updateAvailableLimit(req.params.id, totalAmount);

      const updatedCard = await CreditCard.findById(req.params.id);

      res.status(201).json({
        ...expense,
        total_amount: parseFloat(expense.total_amount),
        installment_amount: parseFloat(expense.installment_amount),
        available_limit: parseFloat(updatedCard.available_limit),
      });
    },
  ],

  delete: async (req, res) => {
    const card = await CreditCard.findById(req.params.id);
    if (!card || card.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Credit card not found' });
    }
    await CreditCard.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = creditCardController;
