import { useMemo, useState } from 'react';
import { Sparkles, Droplet, Mic } from 'lucide-react';

const products = [
  { name: 'Lip Balm', icon: Droplet, color: 'bg-pink-100' },
  { name: 'Solid Perfume', icon: Sparkles, color: 'bg-purple-100' }
];

export default function SalesForm({ apiUrl, token, onSaved, notify }) {
  const today = new Date().toISOString().slice(0, 10);
  const [product, setProduct] = useState('Lip Balm');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(5);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => Number(quantity || 0) * Number(price || 0), [quantity, price]);

  const saveSale = async () => {
    setLoading(true);
    const res = await fetch(`${apiUrl}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        product,
        quantity: Number(quantity),
        price: Number(price),
        customer_name: customerName,
        phone,
        date
      })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      notify(data.error || 'Could not save sale', 'error');
      return;
    }

    setQuantity(1);
    setPrice(5);
    setCustomerName('');
    setPhone('');
    onSaved();
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify('Voice input not supported in this browser', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();
      if (text.includes('lip')) setProduct('Lip Balm');
      if (text.includes('perfume')) setProduct('Solid Perfume');
      const qty = text.match(/quantity\s*(\d+)|(\d+)\s*(piece|pieces|pcs)/);
      if (qty) setQuantity(Number(qty[1] || qty[2]));
      notify(`Voice captured: ${text}`);
    };
    recognition.start();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Add Sale</h2>
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
        <label className="text-lg font-semibold">
          Quantity
          <input
            className="mt-2 w-full rounded-xl border p-4 text-lg"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <label className="text-lg font-semibold">
          Price
          <input
            className="mt-2 w-full rounded-xl border p-4 text-lg"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-lg font-semibold">
          Customer name (optional)
          <input className="mt-2 w-full rounded-xl border p-4 text-lg" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </label>
        <label className="text-lg font-semibold">
          Phone (optional)
          <input className="mt-2 w-full rounded-xl border p-4 text-lg" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      </div>

      <label className="block text-lg font-semibold">
        Date
        <input type="date" className="mt-2 w-full rounded-xl border p-4 text-lg" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div className="rounded-xl bg-[#eadcca] p-4 text-xl font-bold">Total: ${total.toFixed(2)}</div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={saveSale}
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-6 py-4 text-xl font-bold text-white disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save Sale'}
        </button>
        <button onClick={startVoiceInput} className="flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-4 text-lg font-semibold">
          <Mic size={20} /> Voice Input
        </button>
      </div>
    </div>
  );
}
