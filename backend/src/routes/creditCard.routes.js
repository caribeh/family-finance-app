const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const creditCardController = require('../controllers/creditCardController');

router.get('/', authMiddleware, resolveDashboard, creditCardController.getAll);
router.post('/', authMiddleware, resolveDashboard, creditCardController.create);
router.get('/:id/invoice', authMiddleware, resolveDashboard, creditCardController.getInvoice);
router.post('/:id/expenses', authMiddleware, resolveDashboard, creditCardController.addExpense);
router.delete('/:id', authMiddleware, resolveDashboard, creditCardController.delete);

module.exports = router;
