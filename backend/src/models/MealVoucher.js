const { pool } = require('../config/database');

const MealVoucher = {
  async create({ workspaceId, description, monthlyCredit, creditDate }) {
    const result = await pool.query(
      'INSERT INTO meal_vouchers (workspace_id, description, monthly_credit, available_balance, credit_date) VALUES ($1, $2, $3, $3, $4) RETURNING *',
      [workspaceId, description, monthlyCredit, creditDate]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM meal_vouchers WHERE workspace_id = $1 ORDER BY credit_date DESC',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM meal_vouchers WHERE id = $1', [id]);
    return result.rows[0];
  },

  async addCredit(id, amount) {
    const result = await pool.query(
      'UPDATE meal_vouchers SET available_balance = available_balance + $1, monthly_credit = monthly_credit + $1 WHERE id = $2 RETURNING *',
      [amount, id]
    );
    return result.rows[0];
  },

  async reduceBalance(id, amount) {
    const voucher = await this.findById(id);
    if (parseFloat(voucher.available_balance) < parseFloat(amount)) {
      throw new Error('Insufficient voucher balance');
    }
    const result = await pool.query(
      'UPDATE meal_vouchers SET available_balance = available_balance - $1 WHERE id = $2 RETURNING *',
      [amount, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM meal_vouchers WHERE id = $1', [id]);
  },
};

module.exports = MealVoucher;
