const { body } = require('express-validator');
const Debt = require('../models/Debt');
const DebtPayment = require('../models/DebtPayment');
const BankAccount = require('../models/BankAccount');
const DailyControl = require('../models/DailyControl');
const validate = require('../middleware/validate');

const debtController = {
  getAll: async (req, res) => {
    const debts = await Debt.findByWorkspaceId(req.workspaceId);
    res.json(debts.map((d) => ({
      ...d,
      installment_amount: parseFloat(d.installment_amount),
    })));
  },

  create: [
    body('creditor_debtor').trim().notEmpty().withMessage('Creditor/debtor is required'),
    body('installment_amount').isFloat({ min: 0.01 }).withMessage('Installment amount must be positive'),
    body('total_installments').isInt({ min: 1 }).withMessage('Total installments must be at least 1'),
    body('start_date').isISO8601().withMessage('Start date must be valid'),
    body('type').isIn(['debt', 'loan']).withMessage('Type must be debt or loan'),
    body('bank_account_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const { creditor_debtor: creditorDebtor, installment_amount: installmentAmount, total_installments: totalInstallments, start_date: startDate, type, bank_account_id: bankAccountId } = req.body;
      const debt = await Debt.create({
        workspaceId: req.workspaceId,
        creditorDebtor,
        totalAmount: installmentAmount * totalInstallments,
        installmentAmount,
        totalInstallments,
        startDate,
        type,
        bankAccountId,
      });
      res.status(201).json({
        ...debt,
        installment_amount: parseFloat(debt.installment_amount),
      });
    },
  ],

  payInstallment: [
    body('bank_account_id').optional({ nullable: true }).isUUID(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('member_id').optional({ nullable: true }).isUUID(),
    validate,
    async (req, res) => {
      const existing = await Debt.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Debt not found' });
      }

      const { bank_account_id: bankAccountId, amount: customAmount, member_id: memberId } = req.body;
      const paymentAmount = customAmount ? parseFloat(customAmount) : parseFloat(existing.installment_amount);

      if (bankAccountId) {
        const account = await BankAccount.findById(bankAccountId);
        if (!account || account.workspace_id !== req.workspaceId) {
          return res.status(404).json({ error: 'Bank account not found' });
        }
        await BankAccount.updateBalance(bankAccountId, -paymentAmount);
      }

      try {
        const debt = await Debt.payInstallment(req.params.id, bankAccountId);

        const today = new Date().toISOString().split('T')[0];
        const dailyControlEntry = await DailyControl.create({
          workspaceId: req.workspaceId,
          memberId,
          type: 'debit',
          description: `Pagamento ${existing.type === 'loan' ? 'emprestimo' : 'divida'} ${existing.creditor_debtor} (${debt.paid_installments}/${debt.total_installments})`,
          amount: paymentAmount,
          date: today,
          paymentMethod: bankAccountId ? 'bank_transfer' : 'cash',
          bankAccountId: bankAccountId || null,
          creditCardId: null,
          mealVoucherId: null,
          category: existing.type === 'loan' ? 'Emprestimo' : 'Divida',
          source: 'debt_payment',
        });

        await DebtPayment.create({
          debtId: req.params.id,
          workspaceId: req.workspaceId,
          amount: paymentAmount,
          paymentDate: today,
          bankAccountId: bankAccountId || null,
          dailyControlId: dailyControlEntry.id,
        });

        res.json({
          ...debt,
          installment_amount: parseFloat(debt.installment_amount),
          remaining_installments: debt.total_installments - debt.paid_installments,
          payment_amount: paymentAmount,
        });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    },
  ],

  delete: async (req, res) => {
    const existing = await Debt.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    await Debt.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = debtController;
