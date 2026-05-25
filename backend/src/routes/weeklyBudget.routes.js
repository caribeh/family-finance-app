const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const weeklyBudgetController = require('../controllers/weeklyBudgetController');

router.get('/', authMiddleware, resolveDashboard, weeklyBudgetController.get);
router.get('/month', authMiddleware, resolveDashboard, weeklyBudgetController.getMonthWeeks);
router.put('/', authMiddleware, resolveDashboard, weeklyBudgetController.upsert);

module.exports = router;
