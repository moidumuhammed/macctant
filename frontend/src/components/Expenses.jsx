import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

const categories = ['Raw Material', 'Packaging', 'Marketing', 'Misc'];

export default function Expenses({ apiUrl, token, refreshKey, onChange, notify }) {
  const [form, setForm] = useState({
    name: '',
    category: categories[0],
    amount: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch(`${apiUrl}/expenses`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return notify(data.error || 'Unable to load expenses', 'error');
    setList(data);
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshKey]);

  const addExpense = async () => {
    const res = await fetch(`${apiUrl}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...form, amount: Number(form.amount) })
    });

    const data = await res.json();
    if (!res.ok) return notify(data.error || 'Could not add expense', 'error');

    setForm({ ...form, name: '', amount: '' });
    notify('Expense added successfully');
    onChange();
    fetchExpenses();
  };

  const deleteExpense = async (id) => {
    const res = await fetch(`${apiUrl}/expenses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) return notify(data.error || 'Delete failed', 'error');

    notify('Expense deleted successfully');
    onChange();
    fetchExpenses();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Expenses</h2>

      <div className="grid gap-2 rounded-2xl bg-[#fff9f2] p-4 md:grid-cols-4">
        <input className="rounded-xl border p-3" placeholder="Expense name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="rounded-xl border p-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className="rounded-xl border p-3" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <input className="rounded-xl border p-3" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <button onClick={addExpense} className="rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white md:col-span-4">Add Expense</button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-center font-semibold">Loading expenses...</div>
      ) : (
        <div className="space-y-2">
          {list.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-semibold">{expense.name}</p>
                <p className="text-xs text-slate-500">{expense.category} • {expense.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-rose-600">${Number(expense.amount).toFixed(2)}</span>
                <button onClick={() => deleteExpense(expense.id)} className="rounded-lg bg-red-100 p-2 text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
