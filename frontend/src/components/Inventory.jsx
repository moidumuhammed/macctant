import { useEffect, useState } from 'react';

export default function Inventory({ apiUrl, token, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`${apiUrl}/inventory`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLoading(false);
      if (res.ok) setItems(data);
    };
    load();
  }, [apiUrl, token, refreshKey]);

  if (loading) return <div className="rounded-2xl bg-slate-50 p-6">Loading inventory...</div>;

  return (
    <div className="rounded-2xl border p-4">
      <h2 className="mb-4 text-2xl font-bold">Inventory</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.product} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <p className="font-semibold">{item.product}</p>
            <p className={`font-bold ${item.stock <= 10 ? 'text-red-600' : 'text-slate-700'}`}>
              {item.stock} in stock {item.stock <= 10 ? '(Low stock warning)' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
