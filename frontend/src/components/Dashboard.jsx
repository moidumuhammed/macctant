import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard({ apiUrl, token, refreshKey }) {
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/dashboard?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [apiUrl, token, period, refreshKey]);

  if (!data) return <div className="rounded-2xl bg-white p-6 shadow">Loading dashboard...</div>;

  const chartData = {
    labels: data.chart.labels,
    datasets: [
      { label: 'Sales', data: data.chart.sales, borderColor: '#10b981', backgroundColor: '#d1fae5' },
      { label: 'Expenses', data: data.chart.expenses, borderColor: '#ef4444', backgroundColor: '#fee2e2' }
    ]
  };

  const profitPositive = data.profitLoss >= 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total Sales" value={`$${data.totalSales.toFixed(2)}`} color="bg-pastelGreen" />
        <Card title="Total Expenses" value={`$${data.totalExpenses.toFixed(2)}`} color="bg-pastelPink" />
        <Card
          title="Profit / Loss"
          value={`$${data.profitLoss.toFixed(2)}`}
          color={profitPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-4 flex flex-wrap gap-3">
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-4 py-2 font-semibold ${period === p ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <Line data={chartData} />
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
