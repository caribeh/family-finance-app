const { pool } = require('../config/database');

const FixedExpense = {
  async create({ workspaceId, description, amount, dueDay, category, paymentMethod = 'cash', creditCardId, bankAccountId }) {
    const result = await pool.query(
      'INSERT INTO fixed_expenses (workspace_id, description, amount, due_day, category, payment_method, credit_card_id, bank_account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [workspaceId, description, amount, dueDay, category, paymentMethod, creditCardId || null, bankAccountId || null]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM fixed_expenses WHERE workspace_id = $1 ORDER BY due_day',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM fixed_expenses WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { description, amount, dueDay, category, paymentMethod, creditCardId, bankAccountId, isPaid }) {
    const result = await pool.query(
      'UPDATE fixed_expenses SET description = $1, amount = $2, due_day = $3, category = $4, payment_method = $5, credit_card_id = $6, bank_account_id = $7, is_paid = $8 WHERE id = $9 RETURNING *',
      [description, amount, dueDay, category, paymentMethod, creditCardId || null, bankAccountId || null, isPaid, id]
    );
    return result.rows[0];
  },

  async markPaid(id, bankAccountId) {
    const result = await pool.query(
      'UPDATE fixed_expenses SET is_paid = TRUE, paid_date = CURRENT_DATE, bank_account_id = COALESCE($1, bank_account_id) WHERE id = $2 RETURNING *',
      [bankAccountId || null, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM fixed_expenses WHERE id = $1', [id]);
  },
};

module.exports = FixedExpense;
