import { useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/Dashboard';
import SalesForm from './components/SalesForm';
import ExpenseForm from './components/ExpenseForm';
import Inventory from './components/Inventory';
import Reports from './components/Reports';

const API_URL = 'http://localhost:4000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [active, setActive] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = useMemo(
    () => [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'sale', label: 'Add Sale' },
      { key: 'expense', label: 'Add Expense' },
      { key: 'inventory', label: 'Inventory' },
      { key: 'reports', label: 'Reports' }
    ],
    []
  );

  if (!token) {
    return (
      <LoginPage
        apiUrl={API_URL}
        onLogin={(newToken) => {
          localStorage.setItem('token', newToken);
          setToken(newToken);
        }}
      />
    );
  }

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-slate-800">Macctant</h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-slate-700 shadow"
          >
            <LogOut size={18} /> Logout
          </button>
        </header>

        <nav className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`rounded-2xl px-4 py-4 text-lg font-semibold transition ${
                active === tab.key
                  ? 'bg-pastelBlue text-slate-900 shadow-md'
                  : 'bg-white text-slate-700 shadow'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {active === 'dashboard' && <Dashboard apiUrl={API_URL} token={token} refreshKey={refreshKey} />}
        {active === 'sale' && (
          <SalesForm apiUrl={API_URL} token={token} onSaved={() => setRefreshKey((k) => k + 1)} />
        )}
        {active === 'expense' && (
          <ExpenseForm apiUrl={API_URL} token={token} onSaved={() => setRefreshKey((k) => k + 1)} />
        )}
        {active === 'inventory' && <Inventory apiUrl={API_URL} token={token} />}
        {active === 'reports' && <Reports apiUrl={API_URL} token={token} />}
      </div>
    </div>
  );
}
