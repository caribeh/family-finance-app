const { pool } = require('../config/database');

const WeeklyBudgetLimit = {
  async upsert({ userId, limitAmount, weekNumber, year }) {
    const result = await pool.query(
      `INSERT INTO weekly_budget_limits (user_id, limit_amount, week_number, year)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, week_number, year)
       DO UPDATE SET limit_amount = $2, updated_at = NOW()
       RETURNING *`,
      [userId, limitAmount, weekNumber, year]
    );
    return result.rows[0];
  },

  async findByWeek(userId, weekNumber, year) {
    const result = await pool.query(
      'SELECT * FROM weekly_budget_limits WHERE user_id = $1 AND week_number = $2 AND year = $3',
      [userId, weekNumber, year]
    );
    return result.rows[0];
  },

  async findByUserAndYear(userId, year) {
    const result = await pool.query(
      'SELECT * FROM weekly_budget_limits WHERE user_id = $1 AND year = $2 ORDER BY week_number',
      [userId, year]
    );
    return result.rows;
  },
};

module.exports = WeeklyBudgetLimit;
