import { useEffect, useState } from 'react';

const categories = ['Raw Materials', 'Marketing', 'Misc'];

export default function ExpenseForm({ apiUrl, token, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/expense-suggestions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((rows) => setSuggestions(rows));
  }, [apiUrl, token]);

  const saveExpense = async () => {
    setMessage('');
    const res = await fetch(`${apiUrl}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, category, amount: Number(amount), date })
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Could not save expense');
      return;
    }

    setMessage('✅ Expense saved!');
    setName('');
    setAmount('');
    onSaved();
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow">
      <h2 className="text-2xl font-bold">Add Expense</h2>

      {suggestions.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-slate-500">Quick pick frequent expenses:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => {
                  setName(s.name);
                  setCategory(s.category);
                }}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="block text-lg font-semibold">Expense Name
        <input className="mt-2 w-full rounded-xl border p-4 text-lg" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="block text-lg font-semibold">Category
        <select className="mt-2 w-full rounded-xl border p-4 text-lg" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      <label className="block text-lg font-semibold">Amount
        <input type="number" step="0.01" className="mt-2 w-full rounded-xl border p-4 text-lg" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>

      <label className="block text-lg font-semibold">Date
        <input type="date" className="mt-2 w-full rounded-xl border p-4 text-lg" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <button onClick={saveExpense} className="rounded-xl bg-rose-500 px-6 py-4 text-xl font-bold text-white">Save Expense</button>
      {message && <p className="font-semibold">{message}</p>}
    </div>
  );
}
