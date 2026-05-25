const { pool } = require('../config/database');

const MealVoucherExpense = {
  async create({ mealVoucherId, workspaceId, description, amount, establishment, expenseDate }) {
    const result = await pool.query(
      'INSERT INTO meal_voucher_expenses (meal_voucher_id, workspace_id, description, amount, establishment, expense_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [mealVoucherId, workspaceId, description, amount, establishment, expenseDate]
    );
    return result.rows[0];
  },

  async findByVoucherId(mealVoucherId) {
    const result = await pool.query(
      'SELECT * FROM meal_voucher_expenses WHERE meal_voucher_id = $1 ORDER BY expense_date DESC',
      [mealVoucherId]
    );
    return result.rows;
  },

  async findByWorkspaceIdAndMonth(workspaceId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT * FROM meal_voucher_expenses WHERE workspace_id = $1 AND expense_date >= $2 AND expense_date <= $3 ORDER BY expense_date DESC',
      [workspaceId, monthStart, monthEnd]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM meal_voucher_expenses WHERE id = $1', [id]);
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM meal_voucher_expenses WHERE id = $1', [id]);
  },
};

module.exports = MealVoucherExpense;
