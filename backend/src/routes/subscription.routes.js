const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const subscriptionController = require('../controllers/subscriptionController');

router.get('/', authMiddleware, resolveDashboard, subscriptionController.getAll);
router.post('/', authMiddleware, resolveDashboard, subscriptionController.create);
router.post('/:id/cancel', authMiddleware, resolveDashboard, subscriptionController.cancel);
router.delete('/:id', authMiddleware, resolveDashboard, subscriptionController.delete);

module.exports = router;
