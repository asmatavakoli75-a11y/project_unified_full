
import express from 'express';
import db from '../models/index.js';

const router = express.Router();
const { PredictionModel } = db;

// List all models
router.get('/', async (req, res) => {
  const rows = await PredictionModel.findAll({ order: [['id','DESC']] });
  res.json(rows);
});

// Get active single model
router.get('/active', async (req, res) => {
  const active = await PredictionModel.findOne({ where: { status: 'active' }, order: [['id','DESC']] });
  if (!active) return res.status(404).json({ message: 'No active model' });
  res.json(active);
});

// Get active A/B models
router.get('/active-ab', async (req, res) => {
  const A = await PredictionModel.findOne({ where: { status: 'active-A' }, order: [['id','DESC']] });
  const B = await PredictionModel.findOne({ where: { status: 'active-B' }, order: [['id','DESC']] });
  if (!A && !B) return res.status(404).json({ message: 'No A/B models active' });
  res.json({ A, B });
});

// Promote/Activate a model (single or A/B)
router.post('/:id/promote', async (req, res) => {
  const { id } = req.params;
  const { variant } = req.body || {};
  const row = await PredictionModel.findByPk(id);
  if (!row) return res.status(404).json({ message: 'Model not found' });

  if (variant === 'A') {
    await PredictionModel.update({ status: 'trained' }, { where: { status: 'active-A' } });
    row.status = 'active-A';
  } else if (variant === 'B') {
    await PredictionModel.update({ status: 'trained' }, { where: { status: 'active-B' } });
    row.status = 'active-B';
  } else {
    await PredictionModel.update({ status: 'trained' }, { where: { status: 'active' } });
    row.status = 'active';
  }
  await row.save();
  res.json({ ok: true, id: row.id, status: row.status });
});

export default router;
