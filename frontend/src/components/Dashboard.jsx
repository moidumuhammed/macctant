import { useEffect, useMemo, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard({ apiUrl, token, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`${apiUrl}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setLoading(false);
      if (res.ok) setData(json);
    };
    load();
  }, [apiUrl, token, refreshKey]);

  const salesChartData = useMemo(
    () => ({
      labels: data?.dailySales?.map((item) => item.label) || [],
      datasets: [
        {
          label: 'Daily Sales',
          data: data?.dailySales?.map((item) => item.value) || [],
          borderColor: '#16a34a',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.3
        }
      ]
    }),
    [data]
  );

  const expensePieData = useMemo(
    () => ({
      labels: data?.expenseBreakdown?.map((item) => item.category) || [],
      datasets: [
        {
          label: 'Expense Breakdown',
          data: data?.expenseBreakdown?.map((item) => item.amount) || [],
          backgroundColor: ['#fda4af', '#fcd34d', '#93c5fd', '#c4b5fd', '#6ee7b7']
        }
      ]
    }),
    [data]
  );

  if (loading) return <div className="rounded-2xl bg-slate-50 p-6">Loading dashboard...</div>;
  if (!data) return <div className="rounded-2xl bg-red-50 p-6 text-red-700">Could not load dashboard.</div>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total Sales" value={`$${data.totalSales.toFixed(2)}`} color="bg-emerald-50" />
        <Card title="Total Expenses" value={`$${data.totalExpenses.toFixed(2)}`} color="bg-rose-50" />
        <Card
          title="Profit / Loss"
          value={`$${data.profitLoss.toFixed(2)}`}
          color={data.profitLoss >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <h3 className="mb-4 text-lg font-semibold">Daily Sales Chart</h3>
          <Line data={salesChartData} />
        </div>
        <div className="rounded-2xl border p-4">
          <h3 className="mb-4 text-lg font-semibold">Expense Breakdown</h3>
          <Pie data={expensePieData} />
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <h3 className="mb-3 text-lg font-semibold">Recent Transactions</h3>
        <div className="space-y-2">
          {data.recentTransactions.length === 0 && <p className="text-sm text-slate-500">No transactions yet.</p>}
          {data.recentTransactions.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.type.toUpperCase()} • {item.date}</p>
              </div>
              <span className={item.type === 'sale' ? 'font-bold text-green-700' : 'font-bold text-rose-700'}>
                {item.type === 'sale' ? '+' : '-'}${Number(item.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div className={`rounded-2xl p-5 shadow ${color}`}>
      <p className="text-sm uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
