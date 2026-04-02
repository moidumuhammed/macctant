import { useState } from 'react';

export default function LoginPage({ apiUrl, onLogin }) {
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('macctant123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Login failed');
      return;
    }

    onLogin(data.token);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f3e8d9] to-white p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-slate-800">Macctant</h1>
        <p className="text-center text-slate-500">Modern accounting for your cosmetics business.</p>

        <input className="w-full rounded-xl border border-slate-200 p-4 text-lg" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" className="w-full rounded-xl border border-slate-200 p-4 text-lg" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />

        <button disabled={loading} className="w-full rounded-xl bg-slate-900 p-4 text-lg font-semibold text-white disabled:opacity-50">
          {loading ? 'Signing in...' : 'Login'}
        </button>
        {error && <p className="text-center text-red-600">{error}</p>}
      </form>
    </div>
  );
}
