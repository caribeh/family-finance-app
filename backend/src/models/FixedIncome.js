const { pool } = require('../config/database');

const FixedIncome = {
  async create({ workspaceId, description, amount, dueDay, bankAccountId }) {
    const result = await pool.query(
      'INSERT INTO fixed_incomes (workspace_id, description, amount, due_day, bank_account_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [workspaceId, description, amount, dueDay, bankAccountId || null]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM fixed_incomes WHERE workspace_id = $1 ORDER BY due_day',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM fixed_incomes WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { description, amount, dueDay, bankAccountId }) {
    const result = await pool.query(
      'UPDATE fixed_incomes SET description = $1, amount = $2, due_day = $3, bank_account_id = $4 WHERE id = $5 RETURNING *',
      [description, amount, dueDay, bankAccountId || null, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM fixed_incomes WHERE id = $1', [id]);
  },
};

module.exports = FixedIncome;
