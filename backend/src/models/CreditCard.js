const { pool } = require('../config/database');

const CreditCard = {
  async create({ workspaceId, memberId, name, brand, creditLimit, closingDay, dueDay }) {
    const result = await pool.query(
      'INSERT INTO credit_cards (workspace_id, member_id, name, brand, credit_limit, available_limit, closing_day, due_day) VALUES ($1, $2, $3, $4, $5, $5, $6, $7) RETURNING *',
      [workspaceId, memberId || null, name, brand, creditLimit, closingDay, dueDay]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM credit_cards WHERE workspace_id = $1 ORDER BY name',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM credit_cards WHERE id = $1', [id]);
    return result.rows[0];
  },

  async updateAvailableLimit(id, amount) {
    const result = await pool.query(
      'UPDATE credit_cards SET available_limit = available_limit - $1 WHERE id = $2 RETURNING *',
      [amount, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM credit_cards WHERE id = $1', [id]);
  },
};

module.exports = CreditCard;
