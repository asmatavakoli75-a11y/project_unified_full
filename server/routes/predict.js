
import express from 'express';
import db from '../models/index.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const router = express.Router();
const { PredictionModel, Assessment, FeatureFlag } = db;

function blobToModelFile(modelRow){
  const dir = path.resolve('server/models_store');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `model_${modelRow.id}.pkl`);
  if (modelRow.modelData) fs.writeFileSync(file, Buffer.from(modelRow.modelData));
  return file;
}
function hash2Bucket(str){
  if (!str) return 'A';
  let sum = 0; for (let i=0;i<str.length;i++) sum = (sum + str.charCodeAt(i)) % 997;
  return (sum % 2)===0 ? 'A' : 'B';
}
async function getActiveModel(variant=null){
  if (variant === 'A') return await PredictionModel.findOne({ where: { status: 'active-A' }, order: [['id','DESC']] });
  if (variant === 'B') return await PredictionModel.findOne({ where: { status: 'active-B' }, order: [['id','DESC']] });
  return await PredictionModel.findOne({ where: { status: 'active' }, order: [['id','DESC']] });
}
function responsesToFeatures(assessment){
  const feats = {};
  const arr = Array.isArray(assessment.responses) ? assessment.responses : [];
  for (const it of arr){
    const qid = it.questionId || it.id || it.qid;
    const score = it.score ?? it.answer ?? 0;
    if (qid!=null) feats[`Q${qid}_score`] = Number(score)||0;
  }
  return feats;
}
async function runPythonPredict(modelPath, features, batch=false){
  const py = 'python3'; const script = path.resolve('server/scripts/predict.py');
  const args = [script, '--model', modelPath, '--features', JSON.stringify(features)];
  if (batch) args.splice(2, 0, '--batch');
  return await new Promise((resolve, reject) => {
    const p = spawn(py, args);
    let out='', err='';
    p.stdout.on('data', d=> out += d.toString());
    p.stderr.on('data', d=> err += d.toString());
    p.on('close', code => {
      if (code !== 0) return reject(new Error(err||out||'python failed'));
      try{ resolve(JSON.parse(out)); }catch(e){ reject(e); }
    });
  });
}

// Single predict
router.post('/', async (req, res) => {
  try{
    const flag = await FeatureFlag.findOne({ where: { key: 'predict_ab' } });
    const abOn = (flag?.value==='on');

    let features = req.body?.features || null;
    let assessmentId = req.body?.assessmentId || null;
    let abKey = req.body?.abKey || null;

    if (!features && assessmentId){
      const a = await Assessment.findByPk(assessmentId);
      if (!a) return res.status(404).json({ message: 'Assessment not found' });
      features = responsesToFeatures(a);
      if (!abKey) abKey = a.patientId ? String(a.patientId) : String(a.id);
    }
    if (!features) return res.status(400).json({ message: 'Missing features or assessmentId' });

    let modelRow = null, variant = null;
    if (abOn){
      const bucket = hash2Bucket(abKey||'default'); variant = bucket;
      modelRow = await getActiveModel(bucket);
      if (!modelRow){ modelRow = await getActiveModel(null); variant = null; }
    } else {
      modelRow = await getActiveModel(null);
    }
    if (!modelRow) return res.status(404).json({ message: 'No active model available' });

    const modelPath = blobToModelFile(modelRow);
    const out = await runPythonPredict(modelPath, features, false);
    res.json({ modelId: modelRow.id, modelName: modelRow.name, variant, ...out });
  }catch(e){
    console.error(e); res.status(500).json({ message: 'Prediction failed', error: String(e) });
  }
});

// Batch predict (+ optional PDF)
router.post('/batch', async (req, res) => {
  try{
    const flag = await FeatureFlag.findOne({ where: { key: 'predict_ab' } });
    const abOn = (flag?.value==='on');
    const { assessmentIds = [], featureRows = [], abKeyField='patientId', generatePdf=false } = req.body || {};

    let items = [];
    if (assessmentIds.length){
      const list = await Assessment.findAll({ where: { id: assessmentIds } });
      items = list.map(a => ({ id: String(a.id), abKey: a[abKeyField]||a.patientId||String(a.id), features: responsesToFeatures(a) }));
    } else if (featureRows.length){
      items = featureRows.map((r,i)=> ({ id: String(r.id ?? i), abKey: r[abKeyField]||String(i), features: r.features||{} }));
    } else {
      return res.status(400).json({ message: 'No inputs' });
    }

    let modelA = null, modelB = null, modelSingle = null;
    if (abOn){
      modelA = await getActiveModel('A'); modelB = await getActiveModel('B');
      if (!modelA || !modelB) modelSingle = await getActiveModel(null);
    } else {
      modelSingle = await getActiveModel(null);
    }
    if (!modelA && !modelB && !modelSingle) return res.status(404).json({ message: 'No active model' });

    // group by model
    const groupA=[], groupB=[], groupS=[];
    for (const it of items){
      if (modelSingle) groupS.push(it);
      else {
        const bucket = hash2Bucket(it.abKey||'default');
        if (bucket==='A') groupA.push(it); else groupB.push(it);
      }
    }
    async function doGroup(modelRow, arr){
      if (!modelRow || !arr.length) return [];
      const modelPath = blobToModelFile(modelRow);
      const preds = await runPythonPredict(modelPath, arr.map(x=>x.features), true);
      return arr.map((it,idx)=> ({ id: it.id, abKey: it.abKey, variant: modelRow.status==='active-A'?'A':(modelRow.status==='active-B'?'B':null), modelId: modelRow.id, modelName: modelRow.name, ...preds[idx] }));
    }
    let out = [];
    out = out.concat(await doGroup(modelA, groupA));
    out = out.concat(await doGroup(modelB, groupB));
    out = out.concat(await doGroup(modelSingle, groupS));

    let pdfPath = null;
    if (generatePdf){
      const dir = path.resolve('server/uploads/reports');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const fn = `batch_pred_${Date.now()}.pdf`; pdfPath = path.join(dir, fn);
      const doc = new PDFDocument({ size:'A4', margin:36 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      doc.fontSize(16).text('Batch Prediction Report', { align:'center' });
      doc.fontSize(10).text(new Date().toISOString(), { align:'center' });
      doc.moveDown(1);
      out.forEach((r,i)=>{
        if (i>0) doc.moveDown(0.3);
        doc.fontSize(12).text(`#${r.id} — Variant: ${r.variant || 'Single'} — Model: ${r.modelName} (#${r.modelId})`);
        doc.fontSize(11).text(`Pred: ${r.pred} | Proba: ${typeof r.proba==='number'? r.proba.toFixed(3) : r.proba}`);
        doc.moveTo(36, doc.y).lineTo(559, doc.y).strokeColor('#cccccc').stroke().fillColor('#000');
      });
      doc.end();
      await new Promise(resv => stream.on('finish', resv));
    }

    res.json({ items: out, pdfPath: pdfPath ? pdfPath.replace(path.resolve('.'),'').replace(/^\//,'') : null });
  }catch(e){
    console.error(e); res.status(500).json({ message:'Batch prediction failed', error:String(e) });
  }
});

export default router;
