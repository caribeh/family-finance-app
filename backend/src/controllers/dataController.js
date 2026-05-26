const crypto = require('crypto');
const { pool } = require('../config/database');

const quote = (id) => `"${id}"`;

const UUID_COLS = new Set([
  'member_id', 'bank_account_id', 'credit_card_id', 'meal_voucher_id', 'benefit_card_id',
  'debt_id', 'daily_control_id',
]);

const TABLES_IN_ORDER = [
  'members',
  'meal_vouchers',
  'investments',
  'bank_accounts',
  'credit_cards',
  'benefit_cards',
  'fixed_incomes',
  'debts',
  'fixed_expenses',
  'credit_card_expenses',
  'subscriptions',
  'meal_voucher_expenses',
  'daily_expenses',
  'daily_control',
  'debt_payments',
];

const FK_REMAP = {
  members: {},
  meal_vouchers: {},
  investments: {},
  bank_accounts: { member_id: 'members' },
  credit_cards: { member_id: 'members' },
  benefit_cards: { member_id: 'members' },
  fixed_incomes: { bank_account_id: 'bank_accounts' },
  debts: { bank_account_id: 'bank_accounts' },
  fixed_expenses: { credit_card_id: 'credit_cards', bank_account_id: 'bank_accounts' },
  credit_card_expenses: { credit_card_id: 'credit_cards' },
  subscriptions: { credit_card_id: 'credit_cards' },
  meal_voucher_expenses: { meal_voucher_id: 'meal_vouchers' },
  daily_expenses: { credit_card_id: 'credit_cards', meal_voucher_id: 'meal_vouchers' },
  daily_control: {
    member_id: 'members',
    bank_account_id: 'bank_accounts',
    credit_card_id: 'credit_cards',
    meal_voucher_id: 'meal_vouchers',
    benefit_card_id: 'benefit_cards',
  },
  debt_payments: { debt_id: 'debts', bank_account_id: 'bank_accounts', daily_control_id: 'daily_control' },
};

const dataController = {
  exportData: async (req, res) => {
    const { workspaceId } = req;
    const data = {};

    for (const table of TABLES_IN_ORDER) {
      const result = await pool.query(
        `SELECT * FROM ${table} WHERE workspace_id = $1 ORDER BY created_at`,
        [workspaceId]
      );
      data[table] = result.rows;
    }

    res.json({
      version: 1,
      exported_at: new Date().toISOString(),
      data,
    });
  },

  importData: async (req, res) => {
    const { workspaceId } = req;
    const payload = req.body;

    if (!payload || !payload.data) {
      return res.status(400).json({ error: 'Invalid import format' });
    }

    const idMap = {};

    try {
      await pool.query('BEGIN');

      for (let i = 0; i < TABLES_IN_ORDER.length; i++) {
        const table = TABLES_IN_ORDER[i];
        const rows = payload.data[table];
        if (!rows || rows.length === 0) continue;

        const columns = Object.keys(rows[0]).filter(
          (col) => col !== 'id' && col !== 'workspace_id' && col !== 'created_at' && col !== 'updated_at'
        );

        const fkMap = FK_REMAP[table] || {};

        for (const row of rows) {
          const newId = crypto.randomUUID();
          idMap[`${table}:${row.id}`] = newId;

          const cols = [];
          const vals = [];
          let pIdx = 1;

          cols.push(quote('id'));
          vals.push(newId);
          pIdx++;

          cols.push(quote('workspace_id'));
          vals.push(workspaceId);
          pIdx++;

          for (const col of Object.keys(row)) {
            if (col === 'id' || col === 'workspace_id' || col === 'created_at' || col === 'updated_at') continue;
            let val = row[col];
            if (fkMap[col] && val) {
              const mapped = idMap[`${fkMap[col]}:${val}`];
              val = mapped || val;
            }
            cols.push(quote(col));
            if (val === null || val === undefined) {
              vals.push(null);
            } else if (typeof val === 'number') {
              vals.push(String(val));
            } else {
              vals.push(val);
            }
            pIdx++;
          }

          const placeholders = vals.map((_, i) => {
            const colName = cols[i].replace(/"/g, '');
            const needsCast = colName === 'id' || colName === 'workspace_id' || UUID_COLS.has(colName);
            return `$${i + 1}${needsCast ? '::uuid' : ''}`;
          });
          const sql = `INSERT INTO ${quote(table)} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;

          try {
            await pool.query(sql, vals);
          } catch (rowErr) {
            console.error(`Failed on ${table} row:`, { description: row.description || row.name, id: row.id }, rowErr.message);
            throw rowErr;
          }
        }
      }

      await pool.query('COMMIT');
      res.json({ message: 'Data imported successfully', records_imported: Object.keys(idMap).length });
    } catch (err) {
      await pool.query('ROLLBACK');
      const msg = err.message || 'Unknown error';
      res.status(500).json({ error: `Import failed: ${msg}. Data was rolled back.` });
    }
  },
};

module.exports = dataController;
