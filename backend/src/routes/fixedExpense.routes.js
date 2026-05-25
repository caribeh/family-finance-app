const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const fixedExpenseController = require('../controllers/fixedExpenseController');

router.get('/', authMiddleware, resolveDashboard, fixedExpenseController.getAll);
router.post('/', authMiddleware, resolveDashboard, fixedExpenseController.create);
router.put('/:id', authMiddleware, resolveDashboard, fixedExpenseController.update);
router.patch('/:id/mark-paid', authMiddleware, resolveDashboard, fixedExpenseController.markPaid);
router.delete('/:id', authMiddleware, resolveDashboard, fixedExpenseController.delete);

module.exports = router;
