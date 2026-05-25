const { pool } = require('../config/database');

const DailyExpense = {
  async create({ workspaceId, description, amount, expenseDate, paymentMethod, creditCardId, mealVoucherId, paidBy, category }) {
    const result = await pool.query(
      'INSERT INTO daily_expenses (workspace_id, description, amount, expense_date, payment_method, credit_card_id, meal_voucher_id, paid_by, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [workspaceId, description, amount, expenseDate, paymentMethod, creditCardId || null, mealVoucherId || null, paidBy, category]
    );
    return result.rows[0];
  },

  async findByWorkspaceIdAndMonth(workspaceId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT * FROM daily_expenses WHERE workspace_id = $1 AND expense_date >= $2 AND expense_date <= $3 ORDER BY expense_date DESC',
      [workspaceId, monthStart, monthEnd]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM daily_expenses WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { description, amount, expenseDate, paymentMethod, creditCardId, mealVoucherId, paidBy, category }) {
    const result = await pool.query(
      'UPDATE daily_expenses SET description = $1, amount = $2, expense_date = $3, payment_method = $4, credit_card_id = $5, meal_voucher_id = $6, paid_by = $7, category = $8 WHERE id = $9 RETURNING *',
      [description, amount, expenseDate, paymentMethod, creditCardId || null, mealVoucherId || null, paidBy, category, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM daily_expenses WHERE id = $1', [id]);
  },

  async getTotalSpentByWeek(workspaceId, weekNumber, year) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM daily_expenses
       WHERE workspace_id = $1
         AND payment_method NOT IN ('meal_voucher', 'credit_card')
         AND EXTRACT(WEEK FROM expense_date) = $2
         AND EXTRACT(YEAR FROM expense_date) = $3`,
      [workspaceId, weekNumber, year]
    );
    return parseFloat(result.rows[0].total);
  },

  async getTotalSpentByMonth(workspaceId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM daily_expenses
       WHERE workspace_id = $1
         AND payment_method NOT IN ('meal_voucher', 'credit_card')
         AND expense_date >= $2
         AND expense_date <= $3`,
      [workspaceId, monthStart, monthEnd]
    );
    return parseFloat(result.rows[0].total);
  },
};

module.exports = DailyExpense;
