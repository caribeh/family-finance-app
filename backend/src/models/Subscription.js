const { pool } = require('../config/database');

const Subscription = {
  async create({ workspaceId, name, amount, billingDay, creditCardId }) {
    const result = await pool.query(
      'INSERT INTO subscriptions (workspace_id, name, amount, billing_day, credit_card_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [workspaceId, name, amount, billingDay, creditCardId || null]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE workspace_id = $1 ORDER BY name',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    return result.rows[0];
  },

  async cancel(id) {
    const result = await pool.query(
      'UPDATE subscriptions SET is_active = FALSE, cancelled_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM subscriptions WHERE id = $1', [id]);
  },

  async getActiveByWorkspace(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE workspace_id = $1 AND is_active = TRUE ORDER BY name',
      [workspaceId]
    );
    return result.rows;
  },

  async getCancelledThisMonth(workspaceId, month, year) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE workspace_id = $1 AND is_active = FALSE AND cancelled_at >= $2 AND cancelled_at <= $3 ORDER BY cancelled_at',
      [workspaceId, monthStart, monthEnd]
    );
    return result.rows;
  },
};

module.exports = Subscription;
