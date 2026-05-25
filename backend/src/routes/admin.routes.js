const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/members', authMiddleware, adminController.getAllMembers);
router.post('/members', authMiddleware, adminController.createMember);
router.put('/members/:id', authMiddleware, adminController.updateMember);
router.delete('/members/:id', authMiddleware, adminController.deleteMember);

module.exports = router;
