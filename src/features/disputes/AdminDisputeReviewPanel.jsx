import { useState } from 'react';
import { disputeApi, getStoredUser } from './disputeApi';

const actions = ['REQUEST_CLARIFICATION', 'FREEZE_ESCROW', 'APPROVE_FREELANCER', 'APPROVE_CLIENT', 'CLOSE_DISPUTE'];
const statuses = ['OPEN', 'WAITING_RESPONSE', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'];

function AdminDisputeReviewPanel({ dispute, onUpdated }) {
  const user = getStoredUser();
  const [status, setStatus] = useState(dispute.status);
  const [adminAction, setAdminAction] = useState('REQUEST_CLARIFICATION');
  const [resolution, setResolution] = useState(dispute.resolution || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user?.role !== 'admin') return null;

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await disputeApi.updateStatus(dispute.id, { status, adminAction, resolution });
      onUpdated?.(updated);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="font-bold text-ink">Admin review</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm">
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={adminAction} onChange={(e) => setAdminAction(e.target.value)} className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm">
          {actions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm" placeholder="Resolution note" />
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      <button onClick={submit} disabled={loading} className="mt-3 rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Đang cập nhật...' : 'Cập nhật tranh chấp'}</button>
    </div>
  );
}

export default AdminDisputeReviewPanel;
