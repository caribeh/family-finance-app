const { pool } = require('../config/database');

const DailyControl = {
  async create({ workspaceId, memberId, type, description, amount, date, paymentMethod, bankAccountId, creditCardId, mealVoucherId, benefitCardId, category, source }) {
    const result = await pool.query(
      'INSERT INTO daily_control (workspace_id, member_id, type, description, amount, date, payment_method, bank_account_id, credit_card_id, meal_voucher_id, benefit_card_id, category, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [workspaceId, memberId || null, type, description, amount, date, paymentMethod || null, bankAccountId || null, creditCardId || null, mealVoucherId || null, benefitCardId || null, category, source || null]
    );
    return result.rows[0];
  },

  async findByWorkspaceIdAndMonth(workspaceId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT * FROM daily_control WHERE workspace_id = $1 AND date >= $2 AND date <= $3 ORDER BY date DESC',
      [workspaceId, monthStart, monthEnd]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM daily_control WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { type, description, amount, date, paymentMethod, bankAccountId, creditCardId, mealVoucherId, benefitCardId, category, source }) {
    const result = await pool.query(
      'UPDATE daily_control SET type = $1, description = $2, amount = $3, date = $4, payment_method = $5, bank_account_id = $6, credit_card_id = $7, meal_voucher_id = $8, benefit_card_id = $9, category = $10, source = $11 WHERE id = $12 RETURNING *',
      [type, description, amount, date, paymentMethod || null, bankAccountId || null, creditCardId || null, mealVoucherId || null, benefitCardId || null, category, source || null, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM daily_control WHERE id = $1', [id]);
  },

  async getTotalByTypeAndWeek(workspaceId, type, weekNumber, year) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM daily_control
       WHERE workspace_id = $1
         AND type = $2
         AND EXTRACT(WEEK FROM date) = $3
         AND EXTRACT(YEAR FROM date) = $4`,
      [workspaceId, type, weekNumber, year]
    );
    return parseFloat(result.rows[0].total);
  },

  async getTotalByTypeAndMonthForMember(memberId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM daily_control
       WHERE member_id = $1
         AND type = 'debit'
         AND payment_method NOT IN ('meal_voucher', 'credit_card', 'benefit_card')
         AND category NOT IN ('Divida', 'Emprestimo', 'Contas')
         AND date >= $2
         AND date <= $3`,
      [memberId, monthStart, monthEnd]
    );
    return parseFloat(result.rows[0].total);
  },

  async deleteBySourceAndFutureDate(workspaceId, source, description, dateFrom) {
    await pool.query(
      'DELETE FROM daily_control WHERE workspace_id = $1 AND source = $2 AND description = $3 AND date >= $4',
      [workspaceId, source, description, dateFrom]
    );
  },
};

module.exports = DailyControl;
