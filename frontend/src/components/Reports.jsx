export default function Reports({ apiUrl, token }) {
  const download = async (type) => {
    const res = await fetch(`${apiUrl}/export/${type}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'pdf' ? 'macctant-report.pdf' : 'macctant-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-4 text-2xl font-bold">Reports</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <button onClick={() => download('pdf')} className="rounded-xl bg-indigo-500 p-5 text-xl font-bold text-white">
          Download PDF Report
        </button>
        <button onClick={() => download('csv')} className="rounded-xl bg-teal-500 p-5 text-xl font-bold text-white">
          Export CSV Data
        </button>
      </div>
    </div>
  );
}
