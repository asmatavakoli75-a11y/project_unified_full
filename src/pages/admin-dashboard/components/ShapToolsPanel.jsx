
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ShapToolsPanel(){
  const [features, setFeatures] = useState([]);
  const [selected, setSelected] = useState([]);
  const [images, setImages] = useState({});
  const [sampleSize, setSampleSize] = useState(200);

  // Suggest columns via existing analysis (fallback: read questionnaire questions later)
  useEffect(()=>{
    // naive: we can build from recent assessments; for now rely on Q*_score names from server-side
    // Provide a simple default list to select manually if not prefilled
  },[]);

  const gen = async () => {
    const { data } = await axios.post('/api/analysis-adv/shap/dependence', { features: selected, sampleSize });
    setImages(data.images || {});
  }

  return (
    <section style={{marginTop:12}}>
      <h3 className="text-lg font-semibold">SHAP Dependence Plots</h3>
      <div className="flex gap-2 items-center">
        <input className="border p-1 w-24" type="number" value={sampleSize} onChange={e=>setSampleSize(parseInt(e.target.value)||200)} />
        <button className="border px-3 py-1" onClick={gen}>ایجاد نمودارها</button>
        <button className="border px-3 py-1" onClick={()=>setSelected([])}>پاک‌کردن انتخاب</button>
      </div>
      <div className="text-xs text-gray-600 my-2">نام فیچرها را به صورت دستی وارد کنید (مثلاً Q12_score,Q5_score) :</div>
      <input className="border p-1 w-full" placeholder="Q1_score,Q2_score,..." value={selected.join(',')} onChange={e=> setSelected(e.target.value.split(',').map(s=>s.trim()).filter(Boolean)) } />
      <div className="grid grid-cols-2 gap-3 my-3">
        {Object.entries(images).map(([f,p]) => p ? (
          <figure key={f} className="border p-2">
            <figcaption className="text-sm">{f}</figcaption>
            <img src={`/${p}`} alt={f} className="max-w-full" />
          </figure>
        ) : null)}
      </div>
    </section>
  )
}
