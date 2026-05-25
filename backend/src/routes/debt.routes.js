const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const debtController = require('../controllers/debtController');

router.get('/', authMiddleware, resolveDashboard, debtController.getAll);
router.post('/', authMiddleware, resolveDashboard, debtController.create);
router.patch('/:id/pay-installment', authMiddleware, resolveDashboard, debtController.payInstallment);
router.delete('/:id', authMiddleware, resolveDashboard, debtController.delete);

module.exports = router;
