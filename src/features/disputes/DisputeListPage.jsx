import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CreateDisputeForm from './CreateDisputeForm';
import DisputeStatusBadge from './DisputeStatusBadge';
import { disputeApi, getStoredUser } from './disputeApi';

function DisputeListPage() {
  const user = getStoredUser();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setDisputes(await disputeApi.list());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[28px] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dispute center</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Quản lý tranh chấp</h1>
          <p className="mt-2 text-sm text-slate-500">Tạo, theo dõi bằng chứng, phản hồi và xử lý tranh chấp hợp đồng.</p>
        </header>

        {['client', 'freelancer'].includes(user?.role) ? <CreateDisputeForm onCreated={(item) => setDisputes((current) => [item, ...current])} /> : null}

        <section className="rounded-[28px] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Danh sách tranh chấp</h2>
            <button onClick={load} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Tải lại</button>
          </div>
          {loading ? <p className="mt-6 text-sm text-slate-500">Đang tải...</p> : null}
          {error ? <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-6 grid gap-4">
            {disputes.map((item) => (
              <Link key={item.id} to={`/disputes/${item.id}`} className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{item.category} · Contract {item.contractId}</p>
                  </div>
                  <DisputeStatusBadge status={item.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Link>
            ))}
            {!loading && !disputes.length ? <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Chưa có tranh chấp.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default DisputeListPage;
