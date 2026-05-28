const { pool } = require('../config/database');
const DailyControl = require('./DailyControl');
const BankAccount = require('./BankAccount');

const Transfer = {
  async create({ workspaceId, sourceAccountId, targetAccountId, amount, date, description }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const sourceResult = await client.query(
        'UPDATE bank_accounts SET balance = balance - $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [amount, sourceAccountId]
      );
      if (!sourceResult.rows[0]) throw new Error('Source account not found');

      const targetResult = await client.query(
        'UPDATE bank_accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [amount, targetAccountId]
      );
      if (!targetResult.rows[0]) throw new Error('Target account not found');

      const debitEntry = await client.query(
        `INSERT INTO daily_control (workspace_id, type, description, amount, date, payment_method, bank_account_id, category, source)
         VALUES ($1, 'debit', $2, $3, $4, 'transfer', $5, 'Transferencia', 'transfer') RETURNING *`,
        [workspaceId, `Transferencia para ${targetResult.rows[0].name}: ${description || ''}`, amount, date, sourceAccountId]
      );

      const creditEntry = await client.query(
        `INSERT INTO daily_control (workspace_id, type, description, amount, date, payment_method, bank_account_id, category, source)
         VALUES ($1, 'credit', $2, $3, $4, 'transfer', $5, 'Transferencia', 'transfer') RETURNING *`,
        [workspaceId, `Transferencia de ${sourceResult.rows[0].name}: ${description || ''}`, amount, date, targetAccountId]
      );

      await client.query('COMMIT');

      return {
        debit: debitEntry.rows[0],
        credit: creditEntry.rows[0],
        sourceAccount: sourceResult.rows[0],
        targetAccount: targetResult.rows[0],
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = Transfer;
