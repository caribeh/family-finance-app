const { body } = require('express-validator');
const User = require('../models/User');
const validate = require('../middleware/validate');

const userController = {
  getMe: async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      theme: user.theme,
    });
  },

  updateMe: [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('theme').optional().isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
    validate,
    async (req, res) => {
      const { name, theme } = req.body;
      const user = await User.update(req.userId, { name, theme });
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        theme: user.theme,
      });
    },
  ],

  deleteMe: async (req, res) => {
    await User.delete(req.userId);
    res.status(200).json({ message: 'Account deleted successfully' });
  },
};

module.exports = userController;
