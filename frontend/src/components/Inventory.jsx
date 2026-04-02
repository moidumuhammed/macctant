import { useEffect, useState } from 'react';

export default function Inventory({ apiUrl, token }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  const loadInventory = () => {
    fetch(`${apiUrl}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((rows) => setItems(rows));
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const updateStock = async (item) => {
    const res = await fetch(`${apiUrl}/inventory/${encodeURIComponent(item.product_name)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ stock_quantity: Number(item.stock_quantity) })
    });

    if (res.ok) {
      setMessage('✅ Stock updated');
      loadInventory();
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-4 text-2xl font-bold">Inventory</h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.product_name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <p className="text-lg font-semibold">
              {item.product_name}
              {item.stock_quantity <= 10 && <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Low Stock</span>}
            </p>

            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-24 rounded-lg border p-2"
                value={item.stock_quantity}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, stock_quantity: e.target.value };
                  setItems(next);
                }}
              />
              <button onClick={() => updateStock(item)} className="rounded-lg bg-slate-800 px-3 py-2 text-white">Save</button>
            </div>
          </div>
        ))}
      </div>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
