const { pool } = require('../config/database');

function getFirstInstallmentDate(purchaseDate, closingDay, dueDay) {
  const pDate = new Date(purchaseDate);
  const purchaseDay = pDate.getDate();
  if (purchaseDay <= closingDay) {
    return new Date(pDate.getFullYear(), pDate.getMonth(), dueDay);
  }
  return new Date(pDate.getFullYear(), pDate.getMonth() + 1, dueDay);
}

const CreditCard = {
  async create({ workspaceId, memberId, name, brand, creditLimit, closingDay, dueDay }) {
    const result = await pool.query(
      'INSERT INTO credit_cards (workspace_id, member_id, name, brand, credit_limit, available_limit, closing_day, due_day) VALUES ($1, $2, $3, $4, $5, $5, $6, $7) RETURNING *',
      [workspaceId, memberId || null, name, brand, creditLimit, closingDay, dueDay]
    );
    return result.rows[0];
  },

  async findByWorkspaceId(workspaceId) {
    const result = await pool.query(
      'SELECT * FROM credit_cards WHERE workspace_id = $1 ORDER BY name',
      [workspaceId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM credit_cards WHERE id = $1', [id]);
    return result.rows[0];
  },

  async updateAvailableLimit(id, amount) {
    const result = await pool.query(
      'UPDATE credit_cards SET available_limit = available_limit - $1 WHERE id = $2 RETURNING *',
      [amount, id]
    );
    return result.rows[0];
  },

  async advanceInstallments(id) {
    const expenses = await pool.query(
      'SELECT * FROM credit_card_expenses WHERE credit_card_id = $1 AND total_installments > 1 AND current_installment < total_installments',
      [id]
    );

    const card = await this.findById(id);
    if (!card) return 0;

    const now = new Date();
    let releasedAmount = 0;

    for (const exp of expenses.rows) {
      const firstDate = getFirstInstallmentDate(exp.purchase_date, card.closing_day, card.due_day);
      let nextInstallmentMonth = firstDate.getMonth() + exp.current_installment;
      let nextInstallmentYear = firstDate.getFullYear() + Math.floor(nextInstallmentMonth / 12);
      nextInstallmentMonth = nextInstallmentMonth % 12;
      const dueDate = new Date(nextInstallmentYear, nextInstallmentMonth, card.due_day);

      while (dueDate <= now && exp.current_installment < exp.total_installments) {
        await pool.query(
          'UPDATE credit_card_expenses SET current_installment = current_installment + 1 WHERE id = $1',
          [exp.id]
        );
        releasedAmount += parseFloat(exp.installment_amount);
        exp.current_installment++;

        nextInstallmentMonth = firstDate.getMonth() + exp.current_installment;
        nextInstallmentYear = firstDate.getFullYear() + Math.floor(nextInstallmentMonth / 12);
        nextInstallmentMonth = nextInstallmentMonth % 12;
        dueDate.setFullYear(nextInstallmentYear, nextInstallmentMonth, card.due_day);
      }
    }

    if (releasedAmount > 0) {
      await pool.query(
        'UPDATE credit_cards SET available_limit = available_limit + $1 WHERE id = $2',
        [releasedAmount, id]
      );
    }

    return releasedAmount;
  },

  async delete(id) {
    await pool.query('DELETE FROM credit_cards WHERE id = $1', [id]);
  },
};

module.exports = CreditCard;
