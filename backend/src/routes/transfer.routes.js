const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const transferController = require('../controllers/transferController');

router.use(authMiddleware);

router.post('/', transferController.create);

module.exports = router;
