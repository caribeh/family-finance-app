const { pool } = require('../config/database');

const BankAccount = {
  async create({ workspaceId, memberId, name, bankName, accountType = 'checking', balance = 0 }) {
    const result = await pool.query(
      'INSERT INTO bank_accounts (workspace_id, member_id, name, bank_name, account_type, balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [workspaceId, memberId || null, name, bankName, accountType, balance]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM bank_accounts WHERE workspace_id = $1 ORDER BY name',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM bank_accounts WHERE id = $1', [id]);
    return result.rows[0];
  },

  async updateBalance(id, amount) {
    const result = await pool.query(
      'UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2 RETURNING *',
      [amount, id]
    );
    return result.rows[0];
  },

  async update(id, { name, bankName, accountType, balance }) {
    const result = await pool.query(
      'UPDATE bank_accounts SET name = $1, bank_name = $2, account_type = $3, balance = $4 WHERE id = $5 RETURNING *',
      [name, bankName, accountType, balance, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM bank_accounts WHERE id = $1', [id]);
  },
};

module.exports = BankAccount;
