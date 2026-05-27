const { pool } = require('../config/database');

const BillReminder = {
  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM bill_reminders WHERE workspace_id = $1 ORDER BY due_day, name',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM bill_reminders WHERE id = $1', [id]);
    return result.rows[0];
  },

  async create({ workspaceId, name, dueDay }) {
    const result = await pool.query(
      'INSERT INTO bill_reminders (workspace_id, name, due_day) VALUES ($1, $2, $3) RETURNING *',
      [workspaceId, name, dueDay]
    );
    return result.rows[0];
  },

  async update(id, { name, dueDay, active }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (dueDay !== undefined) {
      fields.push(`due_day = $${idx++}`);
      values.push(dueDay);
    }
    if (active !== undefined) {
      fields.push(`active = $${idx++}`);
      values.push(active);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE bill_reminders SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM bill_reminders WHERE id = $1', [id]);
  },

  async findActiveByDueDay(dueDay) {
    const result = await pool.query(
      `SELECT br.*, w.owner_id, u.email, u.name as user_name
       FROM bill_reminders br
       JOIN workspaces w ON w.id = br.workspace_id
       JOIN users u ON u.id = w.owner_id
       WHERE br.due_day = $1 AND br.active = true`,
      [dueDay]
    );
    return result.rows;
  },
};

module.exports = BillReminder;
