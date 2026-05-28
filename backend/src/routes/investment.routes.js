const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const investmentController = require('../controllers/investmentController');

router.get('/', authMiddleware, resolveDashboard, investmentController.getAll);
router.post('/', authMiddleware, resolveDashboard, investmentController.create);
router.post('/:id/redeem', authMiddleware, resolveDashboard, investmentController.redeem);
router.post('/:id/apply', authMiddleware, resolveDashboard, investmentController.apply);
router.put('/:id', authMiddleware, resolveDashboard, investmentController.update);
router.delete('/:id', authMiddleware, resolveDashboard, investmentController.delete);

module.exports = router;
