const { body } = require('express-validator');
const Member = require('../models/Member');
const validate = require('../middleware/validate');

const adminController = {
  getAllMembers: async (req, res) => {
    const members = await Member.findByWorkspaceId(req.workspaceId);
    res.json(members.map((m) => ({
      ...m,
      monthly_budget_limit: parseFloat(m.monthly_budget_limit),
    })));
  },

  createMember: [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('display_role').trim().notEmpty().withMessage('Display role is required'),
    body('weekly_budget_limit').optional().isFloat({ min: 0 }),
    validate,
    async (req, res) => {
      const { name, display_role: displayRole, monthly_budget_limit: monthlyBudgetLimit } = req.body;

      const member = await Member.create({
        workspaceId: req.workspaceId,
        name,
        displayRole,
        monthlyBudgetLimit: monthlyBudgetLimit || 0,
      });

      res.status(201).json({
        id: member.id,
        name: member.name,
        display_role: member.display_role,
        monthly_budget_limit: parseFloat(member.monthly_budget_limit),
      });
    },
  ],

  updateMember: [
    body('name').optional().trim().isLength({ min: 2 }),
    body('display_role').optional().trim().notEmpty(),
      body('monthly_budget_limit').optional().isFloat({ min: 0 }),
    validate,
    async (req, res) => {
      const member = await Member.findById(req.params.id);
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (member.workspace_id !== req.workspaceId) {
        return res.status(403).json({ error: 'Not authorized to update this member' });
      }

      const { name, display_role: displayRole, monthly_budget_limit: monthlyBudgetLimit } = req.body;

      const updated = await Member.update(req.params.id, {
        name: name || member.name,
        displayRole: displayRole || member.display_role,
        monthlyBudgetLimit: monthlyBudgetLimit !== undefined ? monthlyBudgetLimit : member.monthly_budget_limit,
      });

      res.json({
        id: updated.id,
        name: updated.name,
        display_role: updated.display_role,
        monthly_budget_limit: parseFloat(updated.monthly_budget_limit),
      });
    },
  ],

  deleteMember: async (req, res) => {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.workspace_id !== req.workspaceId) {
      return res.status(403).json({ error: 'Not authorized to delete this member' });
    }

    await Member.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = adminController;
