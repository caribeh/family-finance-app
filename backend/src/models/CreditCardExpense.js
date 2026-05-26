const { pool } = require('../config/database');

function getFirstInstallmentDate(purchaseDate, closingDay, dueDay) {
  const pDate = new Date(purchaseDate);
  const purchaseDay = pDate.getDate();
  let firstDate;
  if (purchaseDay <= closingDay) {
    firstDate = new Date(pDate.getFullYear(), pDate.getMonth(), dueDay);
  } else {
    firstDate = new Date(pDate.getFullYear(), pDate.getMonth() + 1, dueDay);
  }
  return firstDate;
}

const CreditCardExpense = {
  async create({ creditCardId, workspaceId, description, totalAmount, installmentAmount, totalInstallments, establishment, purchaseDate }) {
    const result = await pool.query(
      'INSERT INTO credit_card_expenses (credit_card_id, workspace_id, description, total_amount, installment_amount, total_installments, establishment, purchase_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [creditCardId, workspaceId, description, totalAmount, installmentAmount, totalInstallments, establishment, purchaseDate]
    );
    return result.rows[0];
  },

  async findByCardId(creditCardId) {
    const result = await pool.query(
      'SELECT * FROM credit_card_expenses WHERE credit_card_id = $1 ORDER BY purchase_date DESC',
      [creditCardId]
    );
    return result.rows;
  },

  async findByWorkspaceIdAndMonth(workspaceId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT * FROM credit_card_expenses WHERE workspace_id = $1 AND purchase_date >= $2 AND purchase_date <= $3 ORDER BY purchase_date DESC',
      [workspaceId, monthStart, monthEnd]
    );
    return result.rows;
  },

  async findActiveByMonth(workspaceId, month, year) {
    const allExpenses = await pool.query(
      'SELECT cce.*, cc.closing_day, cc.due_day FROM credit_card_expenses cce JOIN credit_cards cc ON cce.credit_card_id = cc.id WHERE cce.workspace_id = $1',
      [workspaceId]
    );
    return allExpenses.rows.filter((exp) => {
      if (exp.total_installments <= 1) {
        const pDate = new Date(exp.purchase_date);
        return pDate.getFullYear() === year && pDate.getMonth() + 1 === month;
      }
      const firstDate = getFirstInstallmentDate(exp.purchase_date, exp.closing_day, exp.due_day);
      const firstYear = firstDate.getFullYear();
      const firstMonth = firstDate.getMonth() + 1;
      const lastMonth = firstMonth + exp.total_installments - 1;
      const lastYear = firstYear + Math.floor((lastMonth - 1) / 12);
      const normalizedLastMonth = ((lastMonth - 1) % 12) + 1;
      const targetMonthNum = firstYear * 12 + firstMonth;
      const lastMonthNum = lastYear * 12 + normalizedLastMonth;
      const givenMonthNum = year * 12 + month;
      return givenMonthNum >= targetMonthNum && givenMonthNum <= lastMonthNum;
    });
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM credit_card_expenses WHERE id = $1', [id]);
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM credit_card_expenses WHERE id = $1', [id]);
  },
};

module.exports = CreditCardExpense;
