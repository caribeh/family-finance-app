const { pool } = require('../config/database');

const Workspace = {
  async create({ ownerId, name }) {
    const result = await pool.query(
      'INSERT INTO workspaces (owner_id, name) VALUES ($1, $2) RETURNING id, owner_id, name, created_at',
      [ownerId, name]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, owner_id, name, created_at FROM workspaces WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByOwnerId(ownerId) {
    const result = await pool.query(
      'SELECT id, owner_id, name, created_at FROM workspaces WHERE owner_id = $1',
      [ownerId]
    );
    return result.rows[0];
  },

  async update(id, { name }) {
    const result = await pool.query(
      'UPDATE workspaces SET name = $1 WHERE id = $2 RETURNING id, owner_id, name, created_at',
      [name, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM workspaces WHERE id = $1', [id]);
  },
};

module.exports = Workspace;
