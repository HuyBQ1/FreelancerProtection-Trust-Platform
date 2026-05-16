import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminDisputeReviewPanel from './AdminDisputeReviewPanel';
import DisputeResponseBox from './DisputeResponseBox';
import DisputeStatusBadge from './DisputeStatusBadge';
import EvidenceUploadForm from './EvidenceUploadForm';
import { disputeApi } from './disputeApi';

function DisputeDetailPage() {
  const { disputeId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setDetail(await disputeApi.detail(disputeId));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [disputeId]);

  const dispute = detail?.dispute;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link to="/disputes" className="text-sm font-semibold text-slate-600 hover:text-ink">Quay lại danh sách</Link>
        {loading ? <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Đang tải...</p> : null}
        {error ? <p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-600">{error}</p> : null}
        {dispute ? (
          <>
            <section className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Dispute detail</p>
                  <h1 className="mt-2 text-3xl font-bold text-ink">{dispute.title}</h1>
                  <p className="mt-2 text-sm text-slate-500">{dispute.category} · Escrow {dispute.escrowStatus}</p>
                </div>
                <DisputeStatusBadge status={dispute.status} />
              </div>
              <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">{dispute.description}</p>
              {dispute.resolution ? <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{dispute.resolution}</p> : null}
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <section className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ink">Bằng chứng</h2>
                <EvidenceUploadForm disputeId={dispute.id} onUploaded={load} />
                {detail.evidence.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-bold text-ink">{item.evidenceType}</p>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-sky-700">{item.fileUrl}</a>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </section>

              <section className="space-y-4 rounded-[28px] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ink">Phản hồi</h2>
                <DisputeResponseBox disputeId={dispute.id} onSubmitted={load} />
                {detail.responses.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-400">{item.senderId}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
                  </div>
                ))}
              </section>
            </div>

            <AdminDisputeReviewPanel dispute={dispute} onUpdated={load} />
          </>
        ) : null}
      </div>
    </div>
  );
}

export default DisputeDetailPage;
