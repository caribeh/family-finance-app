const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const reportController = require('../controllers/reportController');

router.get('/dashboard', authMiddleware, resolveDashboard, reportController.getDashboard);
router.get('/monthly', authMiddleware, resolveDashboard, reportController.getMonthlyReport);

module.exports = router;
