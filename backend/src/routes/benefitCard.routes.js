const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { resolveDashboard } = require('../middleware/dashboardResolver');
const benefitCardController = require('../controllers/benefitCardController');

router.get('/', authMiddleware, resolveDashboard, benefitCardController.getAll);
router.post('/', authMiddleware, resolveDashboard, benefitCardController.create);
router.delete('/:id', authMiddleware, resolveDashboard, benefitCardController.delete);

module.exports = router;
