const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { pool } = require('../config/database');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');
const validate = require('../middleware/validate');

const authController = {
  register: [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
    async (req, res) => {
      const { name, email, password } = req.body;

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, passwordHash });

      const workspace = await Workspace.create({ ownerId: user.id, name: `${name}'s Workspace` });

      const token = jwt.sign({ id: user.id, workspace_id: workspace.id }, jwtSecret, { expiresIn: jwtExpiresIn });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        workspace_id: workspace.id,
        token,
      });
    },
  ],

  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
    async (req, res) => {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const workspace = await Workspace.findByOwnerId(user.id);
      if (!workspace) {
        return res.status(500).json({ error: 'User has no workspace' });
      }

      const token = jwt.sign({ id: user.id, workspace_id: workspace.id }, jwtSecret, { expiresIn: jwtExpiresIn });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        workspace_id: workspace.id,
        token,
      });
    },
  ],
};

module.exports = authController;
