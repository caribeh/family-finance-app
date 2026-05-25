export function validateExpenseForm(data) {
  const errors = {};

  if (!data.description || data.description.trim() === '') {
    errors.description = 'Descricao e obrigatoria';
  }

  if (!data.amount || parseFloat(data.amount) <= 0) {
    errors.amount = 'Valor deve ser positivo';
  }

  if (!data.expense_date) {
    errors.expense_date = 'Data e obrigatoria';
  }

  if (!data.payment_method) {
    errors.payment_method = 'Forma de pagamento e obrigatoria';
  }

  if (data.payment_method === 'credit_card' && !data.credit_card_id) {
    errors.credit_card_id = 'Selecione um cartao';
  }

  if (data.payment_method === 'meal_voucher' && !data.meal_voucher_id) {
    errors.meal_voucher_id = 'Selecione um vale-alimentacao';
  }

  if (!data.paid_by) {
    errors.paid_by = 'Informe quem pagou';
  }

  return errors;
}

export function validateCreditCardExpense(amount, availableLimit) {
  if (parseFloat(amount) > parseFloat(availableLimit)) {
    return 'Valor excede o limite disponivel';
  }
  return null;
}

export function validateVoucherExpense(amount, availableBalance) {
  if (parseFloat(amount) > parseFloat(availableBalance)) {
    return 'Valor excede o saldo disponivel do vale';
  }
  return null;
}
