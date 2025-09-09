
import express from 'express';
import db from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const router = express.Router();
const { Assessment } = db;

function toWideCSV(rows, fp){
  const recs = rows.map(a => {
    const obj = { AssessmentId: a.id, PatientId: a.patientId, QuestionnaireId: a.questionnaireId, RiskScore: a.riskScore };
    const arr = Array.isArray(a.responses)? a.responses : [];
    for (const it of arr){
      const qid = it.questionId || it.id || it.qid;
      const score = it.score ?? it.answer ?? 0;
      if (qid!=null) obj[`Q${qid}_score`] = Number(score)||0;
    }
    return obj;
  });
  const cols = Array.from(new Set(recs.flatMap(r=>Object.keys(r))));
  const lines = [cols.join(',')].concat(recs.map(r=> cols.map(c => (r[c] ?? '')).join(','))).join('\n');
  fs.writeFileSync(fp, lines, 'utf-8');
  return { cols, count: recs.length };
}

// Train (adv) with calibration
router.post('/train-db', async (req, res) => {
  const { target='RiskScore', features=[], algorithms=['random_forest','logistic_regression'], test_size=0.2, calibration='none' } = req.body || {};
  const list = await Assessment.findAll({ order: [['id','ASC']] });
  const dir = path.resolve('server/uploads/exports'); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const csvPath = path.join(dir, `train_${Date.now()}.csv`);
  toWideCSV(list, csvPath);

  const py = 'python3'; const script = path.resolve('server/scripts/analysis_adv.py');
  const args = [script, '--mode','train','--dataset', csvPath, '--target', target, '--features', features.join(','), '--algorithms', algorithms.join(','), '--test_size', String(test_size), '--calibration', calibration];
  const p = spawn(py, args);
  let out='', err='';
  p.stdout.on('data', d=> out += d.toString());
  p.stderr.on('data', d=> err += d.toString());
  p.on('close', code => {
    if (code !== 0) return res.status(500).json({ message: err || out || 'python failed' });
    try { res.json(JSON.parse(out)); } catch(e){ res.status(500).json({ message:'invalid python output', err, raw: out }); }
  });
});

// SHAP dependence plots
router.post('/shap/dependence', async (req, res) => {
  const { features=[], sampleSize=200, modelPath } = req.body || {};
  const list = await Assessment.findAll({ order: [['id','ASC']] });
  const dir = path.resolve('server/uploads/exports'); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const csvPath = path.join(dir, `dep_${Date.now()}.csv`);
  toWideCSV(list, csvPath);

  const py = 'python3'; const script = path.resolve('server/scripts/analysis_adv.py');
  const args = [script, '--mode','shap_dep','--dataset', csvPath, '--features', features.join(','), '--sample_size', String(sampleSize)];
  if (modelPath) args.push('--model_path', modelPath);
  const p = spawn(py, args);
  let out='', err='';
  p.stdout.on('data', d=> out += d.toString());
  p.stderr.on('data', d=> err += d.toString());
  p.on('close', code => {
    if (code !== 0) return res.status(500).json({ message: err || out || 'python failed' });
    try { res.json(JSON.parse(out)); } catch(e){ res.status(500).json({ message:'invalid python output', err, raw: out }); }
  });
});

export default router;
