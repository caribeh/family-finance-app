const { body, query } = require('express-validator');
const WeeklyBudgetLimit = require('../models/WeeklyBudgetLimit');
const DailyExpense = require('../models/DailyExpense');
const { getWeekNumber, getWeeksInMonth } = require('../utils/dateHelpers');
const { calculateRemainingBudget } = require('../utils/budgetCalculator');
const validate = require('../middleware/validate');

const weeklyBudgetController = {
  get: [
    query('week').optional().isInt({ min: 1, max: 53 }),
    query('year').optional().isInt({ min: 2000, max: 2100 }),
    validate,
    async (req, res) => {
      const now = new Date();
      const weekNumber = parseInt(req.query.week) || getWeekNumber(now);
      const year = parseInt(req.query.year) || now.getFullYear();

      const budget = await WeeklyBudgetLimit.findByWeek(req.userId, weekNumber, year);
      const spent = await DailyExpense.getTotalSpentByWeek(req.workspaceId, weekNumber, year);
      const limit = budget ? parseFloat(budget.limit_amount) : 0;
      const remaining = calculateRemainingBudget(limit, spent);

      res.json({
        id: budget ? budget.id : null,
        user_id: req.userId,
        limit_amount: limit,
        week_number: weekNumber,
        year,
        spent,
        remaining,
      });
    },
  ],

  getMonthWeeks: [
    query('month').isInt({ min: 1, max: 12 }),
    query('year').isInt({ min: 2000, max: 2100 }),
    validate,
    async (req, res) => {
      const month = parseInt(req.query.month);
      const year = parseInt(req.query.year);
      const defaultLimit = 0;

      const weeks = getWeeksInMonth(month, year);
      const result = [];

      let previousRollover = 0;

      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const budget = await WeeklyBudgetLimit.findByWeek(req.userId, week.weekNumber, year);
        const spent = await DailyExpense.getTotalSpentByWeek(req.workspaceId, week.weekNumber, year);

        const limit = budget ? parseFloat(budget.limit_amount) : defaultLimit;
        const effectiveLimit = limit + previousRollover;
        const remaining = calculateRemainingBudget(effectiveLimit, spent);
        const rollover = remaining;

        result.push({
          week_number: week.weekNumber,
          label: week.label,
          start: week.start,
          end: week.end,
          limit_amount: limit,
          rollover_from_previous: previousRollover,
          effective_limit: effectiveLimit,
          spent,
          remaining,
          rollover_to_next: rollover,
        });

        previousRollover = rollover;
      }

      res.json({
        month,
        year,
        weeks: result,
        default_limit: defaultLimit,
      });
    },
  ],

  upsert: [
    body('limit_amount').isFloat({ min: 0.01 }).withMessage('Limit amount must be positive'),
    body('week_number').isInt({ min: 1, max: 53 }).withMessage('Week number must be between 1 and 53'),
    body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be valid'),
    validate,
    async (req, res) => {
      const { limit_amount: limitAmount, week_number: weekNumber, year } = req.body;
      const budget = await WeeklyBudgetLimit.upsert({
        userId: req.userId,
        limitAmount,
        weekNumber,
        year,
      });
      const spent = await DailyExpense.getTotalSpentByWeek(req.workspaceId, weekNumber, year);
      const remaining = calculateRemainingBudget(parseFloat(budget.limit_amount), spent);

      const statusCode = budget.created_at === budget.updated_at ? 201 : 200;
      res.status(statusCode).json({
        ...budget,
        limit_amount: parseFloat(budget.limit_amount),
        spent,
        remaining,
      });
    },
  ],
};

module.exports = weeklyBudgetController;
