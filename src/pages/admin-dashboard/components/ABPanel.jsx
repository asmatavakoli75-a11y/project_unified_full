
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ABPanel(){
  const [flag, setFlag] = useState('off');
  const [ab, setAb] = useState({});

  const load = async () => {
    try{
      const f = await axios.get('/api/flags/predict_ab'); setFlag(f.data.value || 'off');
      const abm = await axios.get('/api/models/active-ab').then(r=>r.data).catch(()=>({}));
      setAb(abm);
    }catch(e){}
  };
  useEffect(()=>{ load() }, []);

  const save = async (val) => {
    await axios.post('/api/flags/predict_ab', { value: val });
    setFlag(val); load();
  };

  return (
    <section style={{marginTop:12}}>
      <h3 className="text-lg font-semibold">A/B تست مدل</h3>
      <div className="flex items-center gap-3 my-2">
        <span>Feature Flag:</span>
        <select value={flag} onChange={e=>save(e.target.value)} className="border p-1">
          <option value="off">Off</option>
          <option value="on">On</option>
        </select>
      </div>
      <div className="text-sm text-gray-700">
        <div>Active A: {ab.A ? `${ab.A.name} (#${ab.A.id})` : '—'}</div>
        <div>Active B: {ab.B ? `${ab.B.name} (#${ab.B.id})` : '—'}</div>
      </div>
    </section>
  );
}
