import { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  ListOrdered,
  ReceiptText,
  Boxes,
  Moon,
  Sun,
  LogOut,
  Download
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/Dashboard';
import SalesForm from './components/SalesForm';
import SalesManagement from './components/SalesManagement';
import Expenses from './components/Expenses';
import Inventory from './components/Inventory';
import Toast from './components/Toast';

const API_URL = 'http://localhost:4000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [active, setActive] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  const tabs = useMemo(
    () => [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'add-sale', label: 'Add Sale', icon: ShoppingBag },
      { key: 'sales', label: 'Sales', icon: ListOrdered },
      { key: 'expenses', label: 'Expenses', icon: ReceiptText },
      { key: 'inventory', label: 'Inventory', icon: Boxes }
    ],
    []
  );

  const notify = (message, type = 'success') => setToast({ message, type });

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  };

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
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#f8f3ec] text-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:flex-row md:p-6">
          <aside className="w-full rounded-3xl bg-white p-4 shadow md:w-72 dark:bg-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold">Macctant</h1>
              <button onClick={toggleDarkMode} className="rounded-xl bg-slate-100 p-2 dark:bg-slate-700">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActive(tab.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                      active === tab.key
                        ? 'bg-[#eadcca] text-slate-900 dark:bg-slate-700 dark:text-slate-50'
                        : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 space-y-2">
              <button
                onClick={async () => {
                  const res = await fetch(`${API_URL}/export/sales-csv`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (!res.ok) {
                    notify('Failed to export CSV', 'error');
                    return;
                  }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'macctant-sales.csv';
                  link.click();
                  URL.revokeObjectURL(url);
                  notify('Sales exported to CSV');
                }}
                className="flex w-full items-center gap-2 rounded-xl bg-teal-500 px-4 py-3 font-semibold text-white"
              >
                <Download size={16} /> Export Sales CSV
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white dark:bg-slate-700"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </aside>

          <main className="flex-1 rounded-3xl bg-white p-4 shadow md:p-6 dark:bg-slate-800">
            {active === 'dashboard' && <Dashboard apiUrl={API_URL} token={token} refreshKey={refreshKey} />}
            {active === 'add-sale' && (
              <SalesForm
                apiUrl={API_URL}
                token={token}
                onSaved={() => {
                  setRefreshKey((k) => k + 1);
                  notify('Sale saved successfully');
                }}
                notify={notify}
              />
            )}
            {active === 'sales' && (
              <SalesManagement
                apiUrl={API_URL}
                token={token}
                refreshKey={refreshKey}
                onChange={() => setRefreshKey((k) => k + 1)}
                notify={notify}
              />
            )}
            {active === 'expenses' && (
              <Expenses
                apiUrl={API_URL}
                token={token}
                onChange={() => setRefreshKey((k) => k + 1)}
                refreshKey={refreshKey}
                notify={notify}
              />
            )}
            {active === 'inventory' && <Inventory apiUrl={API_URL} token={token} refreshKey={refreshKey} />}
          </main>
        </div>
      </div>
      <Toast toast={toast} clearToast={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}
