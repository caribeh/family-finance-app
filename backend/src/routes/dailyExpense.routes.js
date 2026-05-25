const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const dailyExpenseController = require('../controllers/dailyExpenseController');

router.get('/', authMiddleware, resolveDashboard, dailyExpenseController.getAll);
router.post('/', authMiddleware, resolveDashboard, dailyExpenseController.create);
router.put('/:id', authMiddleware, resolveDashboard, dailyExpenseController.update);
router.delete('/:id', authMiddleware, resolveDashboard, dailyExpenseController.delete);

module.exports = router;
