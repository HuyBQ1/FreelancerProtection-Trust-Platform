import { useState } from 'react';
import { disputeApi } from './disputeApi';

const categories = [
  'PAYMENT_NOT_RELEASED',
  'POOR_DELIVERABLE_QUALITY',
  'MISSED_DEADLINE',
  'CONTRACT_VIOLATION',
  'FRAUD_SUSPICIOUS_BEHAVIOR',
];

function CreateDisputeForm({ onCreated }) {
  const [form, setForm] = useState({
    contractId: '',
    milestoneId: '',
    againstUser: '',
    category: 'PAYMENT_NOT_RELEASED',
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.contractId || !form.againstUser || !form.title || form.description.length < 10) {
      setError('Vui lòng nhập contract, người bị khiếu nại, tiêu đề và mô tả ít nhất 10 ký tự.');
      return;
    }
    setLoading(true);
    try {
      const dispute = await disputeApi.create({ ...form, milestoneId: form.milestoneId || null });
      setForm({ contractId: '', milestoneId: '', againstUser: '', category: 'PAYMENT_NOT_RELEASED', title: '', description: '' });
      onCreated?.(dispute);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Tạo tranh chấp</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={form.contractId} onChange={(e) => update('contractId', e.target.value)} placeholder="Contract ID" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <input value={form.milestoneId} onChange={(e) => update('milestoneId', e.target.value)} placeholder="Milestone ID" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <input value={form.againstUser} onChange={(e) => update('againstUser', e.target.value)} placeholder="Against user ID" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <select value={form.category} onChange={(e) => update('category', e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>
      <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Tiêu đề tranh chấp" className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
      <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Mô tả chi tiết vấn đề" rows={4} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
      {error ? <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
      <button disabled={loading} className="mt-4 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {loading ? 'Đang tạo...' : 'Tạo tranh chấp'}
      </button>
    </form>
  );
}

export default CreateDisputeForm;
