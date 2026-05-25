const { body } = require('express-validator');
const BenefitCard = require('../models/BenefitCard');
const validate = require('../middleware/validate');

const benefitCardController = {
  getAll: async (req, res) => {
    const cards = await BenefitCard.findByWorkspaceId(req.workspaceId);
    res.json(cards.map((c) => ({
      ...c,
      balance: parseFloat(c.balance),
    })));
  },

  create: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    validate,
    async (req, res) => {
      const { name, description } = req.body;
      const card = await BenefitCard.create({
        workspaceId: req.workspaceId,
        name,
        description,
      });
      res.status(201).json({
        ...card,
        balance: parseFloat(card.balance),
      });
    },
  ],

  delete: async (req, res) => {
    const existing = await BenefitCard.findById(req.params.id);
    if (!existing || existing.workspace_id !== req.workspaceId) {
      return res.status(404).json({ error: 'Benefit card not found' });
    }
    await BenefitCard.delete(req.params.id);
    res.status(204).send();
  },
};

module.exports = benefitCardController;
