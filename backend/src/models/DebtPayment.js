const { pool } = require('../config/database');

const DebtPayment = {
  async create({ debtId, workspaceId, amount, paymentDate, bankAccountId, dailyControlId }) {
    const result = await pool.query(
      'INSERT INTO debt_payments (debt_id, workspace_id, amount, payment_date, bank_account_id, daily_control_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [debtId, workspaceId, amount, paymentDate, bankAccountId || null, dailyControlId || null]
    );
    return result.rows[0];
  },

  async findByWorkspaceIdAndMonth(workspaceId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT dp.*, d.creditor_debtor, d.type FROM debt_payments dp JOIN debts d ON dp.debt_id = d.id WHERE dp.workspace_id = $1 AND dp.payment_date >= $2 AND dp.payment_date <= $3 ORDER BY dp.payment_date',
      [workspaceId, monthStart, monthEnd]
    );
    return result.rows;
  },

  async getTotalByMonth(workspaceId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM debt_payments WHERE workspace_id = $1 AND payment_date >= $2 AND payment_date <= $3',
      [workspaceId, monthStart, monthEnd]
    );
    return parseFloat(result.rows[0].total);
  },

  async deleteByDailyControlId(dailyControlId) {
    await pool.query('DELETE FROM debt_payments WHERE daily_control_id = $1', [dailyControlId]);
  },
};

module.exports = DebtPayment;
