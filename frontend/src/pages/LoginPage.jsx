import { useState } from 'react';

export default function LoginPage({ apiUrl, onLogin }) {
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Login failed');
      return;
    }

    onLogin(data.token);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pastelPink to-white p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-center text-3xl font-bold text-slate-800">Macctant</h1>
        <p className="text-center text-slate-500">Simple accounting for your beauty shop.</p>

        <input
          className="w-full rounded-xl border border-slate-200 p-4 text-lg"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          className="w-full rounded-xl border border-slate-200 p-4 text-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <button className="w-full rounded-xl bg-slate-900 p-4 text-lg font-semibold text-white">Login</button>
        {error && <p className="text-center text-red-600">{error}</p>}
      </form>
    </div>
  );
}
