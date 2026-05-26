const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const dataController = require('../controllers/dataController');

router.get('/export', authMiddleware, dataController.exportData);
router.post('/import', authMiddleware, dataController.importData);

module.exports = router;
