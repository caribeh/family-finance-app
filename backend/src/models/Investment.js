const { pool } = require('../config/database');

const Investment = {
  async create({ workspaceId, type, institution, appliedAmount, applicationDate }) {
    const result = await pool.query(
      'INSERT INTO investments (workspace_id, type, institution, applied_amount, current_value, application_date) VALUES ($1, $2, $3, $4, $4, $5) RETURNING *',
      [workspaceId, type, institution, appliedAmount, applicationDate]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM investments WHERE workspace_id = $1 ORDER BY application_date DESC',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM investments WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { currentValue, status }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (currentValue !== undefined) {
      fields.push(`current_value = $${idx++}`);
      values.push(currentValue);
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE investments SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM investments WHERE id = $1', [id]);
  },
};

module.exports = Investment;
