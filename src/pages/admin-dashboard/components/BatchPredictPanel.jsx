
import React, { useState } from 'react';
import axios from 'axios';

export default function BatchPredictPanel(){
  const [ids, setIds] = useState('1,2,3');
  const [abKeyField, setAbKeyField] = useState('patientId');
  const [items, setItems] = useState([]);
  const [pdf, setPdf] = useState(null);

  const run = async () => {
    const assessmentIds = ids.split(',').map(s=>s.trim()).filter(Boolean).map(Number);
    const { data } = await axios.post('/api/predict/batch', { assessmentIds, abKeyField, generatePdf: true });
    setItems(data.items || []);
    setPdf(data.pdfPath ? `/${data.pdfPath}` : null);
  };

  return (
    <section style={{marginTop:12}}>
      <h3 className="text-lg font-semibold">Batch Prediction + PDF</h3>
      <div className="flex gap-2 my-2">
        <input className="border p-1 flex-1" value={ids} onChange={e=>setIds(e.target.value)} placeholder="IDs: 1,2,3" />
        <input className="border p-1 w-40" value={abKeyField} onChange={e=>setAbKeyField(e.target.value)} />
        <button className="border px-3 py-1" onClick={run}>Run</button>
      </div>
      {pdf && <div className="my-2"><a href={pdf} target="_blank" rel="noreferrer" className="text-blue-600 underline">دانلود PDF گزارش</a></div>}
      {items?.length>0 && (
        <table className="w-full text-sm border">
          <thead><tr><th className="border p-1">ID</th><th className="border p-1">Variant</th><th className="border p-1">Model</th><th className="border p-1">Pred</th><th className="border p-1">Proba</th></tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id}>
                <td className="border p-1">{it.id}</td>
                <td className="border p-1">{it.variant || '-'}</td>
                <td className="border p-1">{it.modelName} #{it.modelId}</td>
                <td className="border p-1">{it.pred}</td>
                <td className="border p-1">{typeof it.proba==='number' ? it.proba.toFixed(3) : it.proba}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
