
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ModelRegistry(){
  const [models, setModels] = useState([]);
  const [active, setActive] = useState(null);

  const load = async () => {
    const list = await axios.get('/api/models').then(r=>r.data);
    setModels(list);
    const a = await axios.get('/api/models/active').then(r=>r.data).catch(()=>null);
    setActive(a);
  };
  useEffect(()=>{ load() }, []);

  const promote = async (id, variant) => {
    await axios.post(`/api/models/${id}/promote`, { variant });
    await load();
  };

  return (
    <section style={{marginTop:12}}>
      <h3 className="text-lg font-semibold">رجیستری مدل‌ها</h3>
      {active ? <div className="text-sm">مدل فعال: <strong>#{active.id}</strong> - {active.name}</div> : <div className="text-sm">مدل فعالی وجود ندارد</div>}
      <table className="w-full text-sm border mt-2">
        <thead><tr><th className="border p-1">ID</th><th className="border p-1">نام</th><th className="border p-1">وضعیت</th><th className="border p-1">عملیات</th></tr></thead>
        <tbody>
          {models.map(m => (
            <tr key={m.id}>
              <td className="border p-1">{m.id}</td>
              <td className="border p-1">{m.name}</td>
              <td className="border p-1">{m.status}</td>
              <td className="border p-1">
                <button className="border px-2 py-1 mr-1" onClick={()=>promote(m.id)}>Promote</button>
                <button className="border px-2 py-1 mr-1" onClick={()=>promote(m.id,'A')}>Promote A</button>
                <button className="border px-2 py-1" onClick={()=>promote(m.id,'B')}>Promote B</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
