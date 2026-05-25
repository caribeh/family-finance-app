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
    });
  },

  updateMe: [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    validate,
    async (req, res) => {
      const { name } = req.body;
      const user = await User.update(req.userId, { name });
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    },
  ],
};

module.exports = userController;
