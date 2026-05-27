const { body } = require('express-validator');
const BillReminder = require('../models/BillReminder');
const ReminderConfig = require('../models/ReminderConfig');
const User = require('../models/User');
const { sendTestNotification } = require('../services/notificationService');
const validate = require('../middleware/validate');

const billReminderController = {
  getAll: async (req, res) => {
    const reminders = await BillReminder.findByWorkspaceId(req.workspaceId);
    res.json(reminders);
  },

  create: [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('dueDay').isInt({ min: 1, max: 31 }).withMessage('Due day must be between 1 and 31'),
    validate,
    async (req, res) => {
      const { name, dueDay } = req.body;
      const reminder = await BillReminder.create({
        workspaceId: req.workspaceId,
        name,
        dueDay,
      });
      res.status(201).json(reminder);
    },
  ],

  update: [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('dueDay').optional().isInt({ min: 1, max: 31 }).withMessage('Due day must be between 1 and 31'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
    validate,
    async (req, res) => {
      const existing = await BillReminder.findById(req.params.id);
      if (!existing || existing.workspace_id !== req.workspaceId) {
        return res.status(404).json({ error: 'Bill reminder not found' });
      }
      const { name, dueDay, active } = req.body;
      const reminder = await BillReminder.update(req.params.id, { name, dueDay, active });
      res.json(reminder);
    },
  ],

  delete: async (req, res) => {
    const existing = await BillReminder.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Bill reminder not found' });
    }
    await BillReminder.delete(req.params.id);
    res.status(204).end();
  },

  getConfig: async (req, res) => {
    const config = await ReminderConfig.findByWorkspaceId(req.workspaceId);
    if (!config) {
      return res.json({ email_recipient: '', telegram_bot_token: '', telegram_chat_id: '' });
    }
    res.json({
      email_recipient: config.email_recipient || '',
      telegram_bot_token: config.telegram_bot_token || '',
      telegram_chat_id: config.telegram_chat_id || '',
    });
  },

  saveConfig: [
    body('email_recipient').optional({ values: 'falsy' }).custom((val) => {
      const emails = val.split(',').map((s) => s.trim()).filter(Boolean);
      for (const email of emails) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error(`Invalid email: ${email}`);
        }
      }
      return true;
    }),
    body('telegram_bot_token').optional({ values: 'falsy' }).isString(),
    body('telegram_chat_id').optional({ values: 'falsy' }).isString(),
    validate,
    async (req, res) => {
      const { email_recipient, telegram_bot_token, telegram_chat_id } = req.body;
      const config = await ReminderConfig.upsert(req.workspaceId, {
        emailRecipient: email_recipient || null,
        telegramBotToken: telegram_bot_token || null,
        telegramChatId: telegram_chat_id || null,
      });
      res.json({
        email_recipient: config.email_recipient || '',
        telegram_bot_token: config.telegram_bot_token || '',
        telegram_chat_id: config.telegram_chat_id || '',
      });
    },
  ],

  testNotification: async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const config = await ReminderConfig.findByWorkspaceId(req.workspaceId);
    const emailRecipient = config?.email_recipient || user.email;
    const telegramBotToken = config?.telegram_bot_token;
    const telegramChatId = config?.telegram_chat_id;

    if (!emailRecipient && !(telegramBotToken && telegramChatId)) {
      return res.status(400).json({ error: 'Configure email or Telegram before testing.' });
    }

    const result = await sendTestNotification(emailRecipient, telegramBotToken, telegramChatId, user.name);
    res.json(result);
  },
};

module.exports = billReminderController;
