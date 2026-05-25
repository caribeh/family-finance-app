const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const dailyControlController = require('../controllers/dailyControlController');

router.get('/', authMiddleware, resolveDashboard, dailyControlController.getAll);
router.post('/', authMiddleware, resolveDashboard, dailyControlController.create);
router.delete('/:id', authMiddleware, resolveDashboard, dailyControlController.delete);

module.exports = router;
