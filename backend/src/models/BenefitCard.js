const { pool } = require('../config/database');

const BenefitCard = {
  async create({ workspaceId, name, description }) {
    const result = await pool.query(
      'INSERT INTO benefit_cards (workspace_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [workspaceId, name, description || null]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM benefit_cards WHERE workspace_id = $1 ORDER BY name',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM benefit_cards WHERE id = $1', [id]);
    return result.rows[0];
  },

  async updateBalance(id, amount) {
    const result = await pool.query(
      'UPDATE benefit_cards SET balance = balance + $1 WHERE id = $2 RETURNING *',
      [amount, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM benefit_cards WHERE id = $1', [id]);
  },
};

module.exports = BenefitCard;
