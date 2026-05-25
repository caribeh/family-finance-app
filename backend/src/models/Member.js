const { pool } = require('../config/database');

const Member = {
  async create({ workspaceId, name, displayRole, monthlyBudgetLimit }) {
    const result = await pool.query(
      'INSERT INTO members (workspace_id, name, display_role, monthly_budget_limit) VALUES ($1, $2, $3, $4) RETURNING *',
      [workspaceId, name, displayRole || 'Membro', monthlyBudgetLimit || 0]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM members WHERE workspace_id = $1 ORDER BY name',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { name, displayRole, monthlyBudgetLimit }) {
    const result = await pool.query(
      'UPDATE members SET name = COALESCE($1, name), display_role = COALESCE($2, display_role), monthly_budget_limit = COALESCE($3, monthly_budget_limit) WHERE id = $4 RETURNING *',
      [name, displayRole, monthlyBudgetLimit, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM members WHERE id = $1', [id]);
  },
};

module.exports = Member;
