import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Droplet, Mic } from 'lucide-react';

const products = [
  { name: 'Lip Balm', icon: Droplet, color: 'bg-pink-100' },
  { name: 'Solid Perfume', icon: Sparkles, color: 'bg-purple-100' }
];

export default function SalesForm({ apiUrl, token, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [product, setProduct] = useState('Lip Balm');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(5);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(today);
  const [message, setMessage] = useState('');
  const [quickMode, setQuickMode] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);

  useEffect(() => {
    fetch(`${apiUrl}/recent-customers`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((rows) => setCustomerOptions(rows));
  }, [apiUrl, token]);

  const total = useMemo(() => Number(quantity || 0) * Number(price || 0), [quantity, price]);

  const saveSale = async () => {
    setMessage('');
    const res = await fetch(`${apiUrl}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        product_name: product,
        quantity: Number(quantity),
        price: Number(price),
        customer_name: customerName,
        phone,
        date
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Could not save sale');
      return;
    }
    setMessage('✅ Sale saved!');
    onSaved();
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();
      if (text.includes('lip')) setProduct('Lip Balm');
      if (text.includes('perfume')) setProduct('Solid Perfume');

      const qtyMatch = text.match(/(\d+)\s*(piece|pcs|items|quantity)?/);
      const priceMatch = text.match(/(\d+(\.\d+)?)\s*(dollar|usd|price)?/);
      if (qtyMatch) setQuantity(Number(qtyMatch[1]));
      if (priceMatch) setPrice(Number(priceMatch[1]));
      setMessage(`🎤 Heard: "${text}"`);
    };
    recognition.start();
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Add Sale</h2>
        <button onClick={() => setQuickMode((q) => !q)} className="rounded-xl bg-slate-900 px-4 py-2 text-white">
          {quickMode ? 'Full Mode' : 'Quick Sale'}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {products.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.name}
              onClick={() => setProduct(p.name)}
              className={`rounded-2xl p-5 text-left text-xl font-semibold shadow ${p.color} ${
                product === p.name ? 'ring-4 ring-slate-400' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon /> {p.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-lg font-semibold">Quantity
          <input className="mt-2 w-full rounded-xl border p-4 text-lg" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label className="text-lg font-semibold">Price
          <input className="mt-2 w-full rounded-xl border p-4 text-lg" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
      </div>

      {!quickMode && (
        <>
          <datalist id="customers-list">
            {customerOptions.map((c) => (
              <option key={`${c.customer_name}-${c.phone}`} value={c.customer_name} />
            ))}
          </datalist>
          <label className="block text-lg font-semibold">Customer Name (optional)
            <input list="customers-list" className="mt-2 w-full rounded-xl border p-4 text-lg" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </label>

          <label className="block text-lg font-semibold">Phone Number (optional)
            <input className="mt-2 w-full rounded-xl border p-4 text-lg" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>

          <label className="block text-lg font-semibold">Date
            <input type="date" className="mt-2 w-full rounded-xl border p-4 text-lg" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </>
      )}

      <div className="rounded-xl bg-pastelBlue p-4 text-xl font-bold">Total: ${total.toFixed(2)}</div>

      <div className="flex flex-wrap gap-3">
        <button onClick={saveSale} className="rounded-xl bg-emerald-500 px-6 py-4 text-xl font-bold text-white">Save Sale</button>
        <button onClick={startVoiceInput} className="flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-4 text-lg font-semibold">
          <Mic size={20} /> Voice Input
        </button>
      </div>

      {message && <p className="font-semibold text-slate-700">{message}</p>}
    </div>
  );
}
