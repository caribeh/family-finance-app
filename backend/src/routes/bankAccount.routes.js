const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const bankAccountController = require('../controllers/bankAccountController');

router.get('/', authMiddleware, resolveDashboard, bankAccountController.getAll);
router.post('/', authMiddleware, resolveDashboard, bankAccountController.create);
router.put('/:id', authMiddleware, resolveDashboard, bankAccountController.update);
router.delete('/:id', authMiddleware, resolveDashboard, bankAccountController.delete);

module.exports = router;
