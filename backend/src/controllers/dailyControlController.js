const { body } = require('express-validator');
const DailyControl = require('../models/DailyControl');
const BankAccount = require('../models/BankAccount');
const CreditCard = require('../models/CreditCard');
const MealVoucher = require('../models/MealVoucher');
const BenefitCard = require('../models/BenefitCard');
const CreditCardExpense = require('../models/CreditCardExpense');
const MealVoucherExpense = require('../models/MealVoucherExpense');
const validate = require('../middleware/validate');

const dailyControlController = {
  getAll: async (req, res) => {
    const { month, year, type } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'month and year query parameters are required' });
    }
    let entries = await DailyControl.findByWorkspaceIdAndMonth(req.workspaceId, parseInt(month), parseInt(year));
    if (type && ['credit', 'debit'].includes(type)) {
      entries = entries.filter((e) => e.type === type);
    }
    res.json(entries.map((e) => ({
      ...e,
      amount: parseFloat(e.amount),
    })));
  },

  create: [
    body('type').isIn(['credit', 'debit', 'meal_voucher']).withMessage('Type must be credit, debit, or meal_voucher'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('date').isISO8601().withMessage('Date must be valid'),
    body('category').optional().trim(),
    body('payment_method').optional().isIn(['cash', 'credit_card', 'meal_voucher', 'bank_transfer', 'pix', 'benefit_card']),
    body('bank_account_id').optional({ nullable: true }).isUUID(),
    body('credit_card_id').optional({ nullable: true }).isUUID(),
    body('meal_voucher_id').optional({ nullable: true }).isUUID(),
    body('benefit_card_id').optional({ nullable: true }).isUUID(),
    body('member_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const { type, description, amount, date, payment_method: paymentMethod, bank_account_id: bankAccountId, credit_card_id: creditCardId, meal_voucher_id: mealVoucherId, benefit_card_id: benefitCardId, category, member_id: memberId } = req.body;

      if (type === 'debit' && !paymentMethod) {
        return res.status(400).json({ error: 'payment_method is required for debit entries' });
      }

      if (type === 'credit' && !bankAccountId && !benefitCardId) {
        return res.status(400).json({ error: 'bank_account_id or benefit_card_id is required for credit entries' });
      }

      if (type === 'debit') {
        if (paymentMethod === 'credit_card' && !creditCardId) {
          return res.status(400).json({ error: 'credit_card_id is required when payment_method is credit_card' });
        }
        if (paymentMethod === 'meal_voucher' && !mealVoucherId) {
          return res.status(400).json({ error: 'meal_voucher_id is required when payment_method is meal_voucher' });
        }
        if (paymentMethod === 'benefit_card' && !benefitCardId) {
          return res.status(400).json({ error: 'benefit_card_id is required when payment_method is benefit_card' });
        }

        if (paymentMethod === 'credit_card') {
          const card = await CreditCard.findById(creditCardId);
          if (!card || card.workspace_id !== req.workspaceId) {
            return res.status(404).json({ error: 'Credit card not found' });
          }
          if (parseFloat(card.available_limit) < amount) {
            return res.status(400).json({ error: 'Insufficient credit limit' });
          }

          const totalInstallments = parseInt(req.body.total_installments) || 1;
          const installmentAmount = amount / totalInstallments;

          await CreditCard.updateAvailableLimit(creditCardId, amount);
          await CreditCardExpense.create({
            creditCardId,
            workspaceId: req.workspaceId,
            description,
            totalAmount: amount,
            installmentAmount,
            totalInstallments,
            establishment: category,
            purchaseDate: date,
          });

          const purchaseDate = new Date(date);
          const purchaseDay = purchaseDate.getDate();
          let firstInstallmentDate;
          if (purchaseDay <= card.closing_day) {
            firstInstallmentDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), card.due_day);
          } else {
            firstInstallmentDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + 1, card.due_day);
          }
          const firstInstallmentDateStr = firstInstallmentDate.toISOString().split('T')[0];
          const firstInstallmentDescription = totalInstallments > 1 ? `${description} (1/${totalInstallments})` : description;

          const firstInstallment = await DailyControl.create({
            workspaceId: req.workspaceId,
            memberId: memberId || null,
            type: 'debit',
            description: firstInstallmentDescription,
            amount: installmentAmount,
            date: firstInstallmentDateStr,
            paymentMethod: 'credit_card',
            bankAccountId: null,
            creditCardId,
            mealVoucherId: null,
            benefitCardId: null,
            category,
          });

          for (let i = 1; i < totalInstallments; i++) {
            const installmentDate = new Date(firstInstallmentDate.getFullYear(), firstInstallmentDate.getMonth() + i, card.due_day);
            const installmentDateStr = installmentDate.toISOString().split('T')[0];
            const installmentDescription = `${description} (${i + 1}/${totalInstallments})`;
            await DailyControl.create({
              workspaceId: req.workspaceId,
              memberId: memberId || null,
              type: 'debit',
              description: installmentDescription,
              amount: installmentAmount,
              date: installmentDateStr,
              paymentMethod: 'credit_card',
              bankAccountId: null,
              creditCardId,
              mealVoucherId: null,
              benefitCardId: null,
              category,
            });
          }

          return res.status(201).json({ ...firstInstallment, amount: parseFloat(firstInstallment.amount), total_installments: totalInstallments, installment_amount: installmentAmount });
        }

        if (paymentMethod === 'benefit_card') {
          const card = await BenefitCard.findById(benefitCardId);
          if (!card || card.workspace_id !== req.workspaceId) {
            return res.status(404).json({ error: 'Benefit card not found' });
          }
          if (parseFloat(card.balance) < amount) {
            return res.status(400).json({ error: 'Insufficient benefit card balance' });
          }
          await BenefitCard.updateBalance(benefitCardId, -amount);
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
            expenseDate: date,
          });
        }

        if (paymentMethod === 'bank_transfer' || paymentMethod === 'pix') {
          if (bankAccountId) {
            await BankAccount.updateBalance(bankAccountId, -amount);
          }
        }
      }

      if (type === 'credit') {
        if (bankAccountId) {
          await BankAccount.updateBalance(bankAccountId, amount);
        }
        if (benefitCardId) {
          await BenefitCard.updateBalance(benefitCardId, amount);
        }
      }

      if (type === 'meal_voucher') {
        if (!mealVoucherId) {
          return res.status(400).json({ error: 'meal_voucher_id is required for meal voucher credits' });
        }
        const voucher = await MealVoucher.findById(mealVoucherId);
        if (!voucher || voucher.workspace_id !== req.workspaceId) {
          return res.status(404).json({ error: 'Meal voucher not found' });
        }
        await MealVoucher.addCredit(mealVoucherId, amount);
      }

      const entry = await DailyControl.create({
        workspaceId: req.workspaceId,
        memberId: memberId || null,
        type,
        description,
        amount,
        date,
        paymentMethod,
        bankAccountId,
        creditCardId,
        mealVoucherId,
        benefitCardId,
        category,
      });

      res.status(201).json({ ...entry, amount: parseFloat(entry.amount) });
    },
  ],

  delete: async (req, res) => {
    const existing = await DailyControl.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (existing.source) {
      return res.status(403).json({ error: 'Cannot delete auto-generated entries' });
    }

    if (existing.type === 'debit') {
      if (existing.payment_method === 'credit_card' && existing.credit_card_id) {
        await CreditCard.updateAvailableLimit(existing.credit_card_id, -parseFloat(existing.amount));
      }
      if (existing.payment_method === 'meal_voucher' && existing.meal_voucher_id) {
        await MealVoucher.addCredit(existing.meal_voucher_id, parseFloat(existing.amount));
      }
      if (existing.payment_method === 'benefit_card' && existing.benefit_card_id) {
        await BenefitCard.updateBalance(existing.benefit_card_id, parseFloat(existing.amount));
      }
      if ((existing.payment_method === 'bank_transfer' || existing.payment_method === 'pix') && existing.bank_account_id) {
        await BankAccount.updateBalance(existing.bank_account_id, parseFloat(existing.amount));
      }
    }

    if (existing.type === 'credit' && existing.bank_account_id) {
      await BankAccount.updateBalance(existing.bank_account_id, -parseFloat(existing.amount));
    }
    if (existing.type === 'credit' && existing.benefit_card_id) {
      await BenefitCard.updateBalance(existing.benefit_card_id, -parseFloat(existing.amount));
    }

    await DailyControl.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = dailyControlController;
