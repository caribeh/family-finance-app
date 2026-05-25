const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const mealVoucherController = require('../controllers/mealVoucherController');

router.get('/', authMiddleware, resolveDashboard, mealVoucherController.getAll);
router.post('/', authMiddleware, resolveDashboard, mealVoucherController.create);
router.post('/:id/credit', authMiddleware, resolveDashboard, mealVoucherController.addCredit);
router.post('/:id/expenses', authMiddleware, resolveDashboard, mealVoucherController.addExpense);
router.delete('/:id', authMiddleware, resolveDashboard, mealVoucherController.delete);

module.exports = router;
