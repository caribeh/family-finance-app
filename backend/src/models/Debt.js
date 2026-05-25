const { pool } = require('../config/database');

const Debt = {
  async create({ workspaceId, creditorDebtor, totalAmount, installmentAmount, totalInstallments, startDate, type, bankAccountId }) {
    const result = await pool.query(
      'INSERT INTO debts (workspace_id, creditor_debtor, total_amount, installment_amount, total_installments, start_date, type, bank_account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [workspaceId, creditorDebtor, totalAmount, installmentAmount, totalInstallments, startDate, type, bankAccountId || null]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM debts WHERE workspace_id = $1 ORDER BY start_date',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM debts WHERE id = $1', [id]);
    return result.rows[0];
  },

  async payInstallment(id, bankAccountId) {
    const debt = await this.findById(id);
    if (debt.paid_installments >= debt.total_installments) {
      throw new Error('All installments already paid');
    }
    const result = await pool.query(
      'UPDATE debts SET paid_installments = paid_installments + 1, bank_account_id = COALESCE($1, bank_account_id) WHERE id = $2 RETURNING *',
      [bankAccountId || null, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM debts WHERE id = $1', [id]);
  },
};

module.exports = Debt;
