
import express from 'express';
import db from '../models/index.js';

const { FeatureFlag } = db;
const router = express.Router();

router.get('/', async (req, res) => {
  const rows = await FeatureFlag.findAll();
  const obj = {}; rows.forEach(r => obj[r.key] = r.value);
  res.json(obj);
});

router.get('/:key', async (req, res) => {
  const row = await FeatureFlag.findOne({ where: { key: req.params.key } });
  res.json({ key: req.params.key, value: row?.value || null });
});

router.post('/:key', async (req, res) => {
  const { value } = req.body || {};
  const [row, created] = await FeatureFlag.findOrCreate({ where: { key: req.params.key }, defaults: { value: String(value) } });
  if (!created) { row.value = String(value); await row.save(); }
  res.json({ ok: true, key: req.params.key, value: row.value });
});

export default router;
