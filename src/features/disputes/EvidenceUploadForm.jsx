import { useState } from 'react';
import { disputeApi } from './disputeApi';

const evidenceTypes = ['IMAGE', 'PDF', 'DELIVERABLE', 'GITHUB_LINK', 'CHAT_HISTORY'];

function EvidenceUploadForm({ disputeId, onUploaded }) {
  const [form, setForm] = useState({ evidenceType: 'IMAGE', fileUrl: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.fileUrl) {
      setError('Vui lòng nhập URL bằng chứng.');
      return;
    }
    setLoading(true);
    try {
      const evidence = await disputeApi.addEvidence(disputeId, form);
      setForm({ evidenceType: 'IMAGE', fileUrl: '', description: '' });
      onUploaded?.(evidence);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 p-4">
      <p className="font-bold text-ink">Thêm bằng chứng</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
        <select value={form.evidenceType} onChange={(e) => setForm({ ...form, evidenceType: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
          {evidenceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="File URL / GitHub link / chat export URL" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
      </div>
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả bằng chứng" rows={3} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      <button disabled={loading} className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Đang tải...' : 'Lưu bằng chứng'}</button>
    </form>
  );
}

export default EvidenceUploadForm;
