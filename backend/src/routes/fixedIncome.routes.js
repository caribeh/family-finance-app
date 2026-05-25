const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const fixedIncomeController = require('../controllers/fixedIncomeController');

router.get('/', authMiddleware, resolveDashboard, fixedIncomeController.getAll);
router.post('/', authMiddleware, resolveDashboard, fixedIncomeController.create);
router.put('/:id', authMiddleware, resolveDashboard, fixedIncomeController.update);
router.delete('/:id', authMiddleware, resolveDashboard, fixedIncomeController.delete);

module.exports = router;
