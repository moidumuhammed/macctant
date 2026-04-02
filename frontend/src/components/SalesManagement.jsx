import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const blank = { product: 'Lip Balm', quantity: 1, price: 5, customer_name: '', phone: '', date: '' };

export default function SalesManagement({ apiUrl, token, refreshKey, onChange, notify }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [form, setForm] = useState(blank);

  const fetchSales = async () => {
    setLoading(true);
    const res = await fetch(`${apiUrl}/sales`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      notify(data.error || 'Unable to load sales', 'error');
      return;
    }
    setSales(data);
  };

  useEffect(() => {
    fetchSales();
  }, [refreshKey]);

  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.total), 0), [sales]);

  const removeSale = async (id) => {
    if (!window.confirm('Delete this sale? Inventory will be restored.')) return;
    const res = await fetch(`${apiUrl}/sales/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error || 'Delete failed', 'error');

    notify('Sale deleted successfully');
    onChange();
    fetchSales();
  };

  const updateSale = async () => {
    const res = await fetch(`${apiUrl}/sales/${editingSaleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity), price: Number(form.price) })
    });

    const data = await res.json();
    if (!res.ok) return notify(data.error || 'Update failed', 'error');

    notify('Sale updated successfully');
    setEditingSaleId(null);
    onChange();
    fetchSales();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Sales Management</h2>
        <div className="rounded-xl bg-emerald-50 px-4 py-2 font-semibold text-emerald-700">Total ${totalSales.toFixed(2)}</div>
      </div>

      {editingSaleId && (
        <div className="space-y-3 rounded-2xl border border-[#eadcca] bg-[#fff9f2] p-4">
          <h3 className="text-lg font-semibold">Edit Sale #{editingSaleId}</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <select className="rounded-lg border p-3" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option>Lip Balm</option>
              <option>Solid Perfume</option>
            </select>
            <input className="rounded-lg border p-3" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <input className="rounded-lg border p-3" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className="rounded-lg border p-3" placeholder="Customer" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            <input className="rounded-lg border p-3" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="rounded-lg border p-3" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={updateSale} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Save Changes</button>
            <button onClick={() => setEditingSaleId(null)} className="rounded-lg bg-slate-200 px-4 py-2 font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center font-semibold">Loading sales...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Total</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t">
                  <td className="p-3 font-semibold">{sale.product}</td>
                  <td className="p-3">{sale.quantity}</td>
                  <td className="p-3">${Number(sale.total).toFixed(2)}</td>
                  <td className="p-3">{sale.date}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingSaleId(sale.id);
                          setForm({
                            product: sale.product,
                            quantity: sale.quantity,
                            price: sale.price,
                            customer_name: sale.customer_name || '',
                            phone: sale.phone || '',
                            date: sale.date
                          });
                        }}
                        className="rounded-lg bg-blue-100 p-2 text-blue-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => removeSale(sale.id)} className="rounded-lg bg-red-100 p-2 text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
