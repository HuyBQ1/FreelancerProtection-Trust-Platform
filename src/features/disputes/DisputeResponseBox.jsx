import { useState } from 'react';
import { disputeApi } from './disputeApi';

function DisputeResponseBox({ disputeId, onSubmitted }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!message.trim()) {
      setError('Vui lòng nhập phản hồi.');
      return;
    }
    setLoading(true);
    try {
      const response = await disputeApi.addResponse(disputeId, { message });
      setMessage('');
      onSubmitted?.(response);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="font-bold text-ink">Phản hồi tranh chấp</p>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Nhập phản hồi hoặc yêu cầu làm rõ..." />
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      <button onClick={submit} disabled={loading} className="mt-3 rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Đang gửi...' : 'Gửi phản hồi'}</button>
    </div>
  );
}

export default DisputeResponseBox;
