const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const billReminderController = require('../controllers/billReminderController');

router.use(authMiddleware);

router.get('/config', billReminderController.getConfig);
router.put('/config', billReminderController.saveConfig);
router.post('/test', billReminderController.testNotification);

router.get('/', billReminderController.getAll);
router.post('/', billReminderController.create);
router.put('/:id', billReminderController.update);
router.delete('/:id', billReminderController.delete);

module.exports = router;
