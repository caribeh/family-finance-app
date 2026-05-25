const { pool } = require('../config/database');

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

  async findById(id) {
    const result = await pool.query('SELECT * FROM credit_card_expenses WHERE id = $1', [id]);
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM credit_card_expenses WHERE id = $1', [id]);
  },
};

module.exports = CreditCardExpense;
