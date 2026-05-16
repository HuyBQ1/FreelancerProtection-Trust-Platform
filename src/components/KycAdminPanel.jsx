import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileCheck2, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import SectionCard from './SectionCard';

const TOKEN_KEY = 'fptp_token';
const KYC_API_BASE = import.meta.env.VITE_KYC_API_URL || 'http://localhost:8001';

const statusLabels = {
  PENDING: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang xem xét',
  APPROVED: 'Đã xác minh',
  REJECTED: 'Từ chối',
};

const statusTones = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  UNDER_REVIEW: 'bg-sky-50 text-sky-700 border-sky-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
};

function fileHref(file) {
  const url = file?.fileUrl || '';
  if (!url) return '';
  return url.startsWith('http') ? url : `${KYC_API_BASE}${url}`;
}

function formatDate(value) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';
  return date.toLocaleString('vi-VN');
}

function FilePreview({ title, file }) {
  const href = fileHref(file);
  const isImage = `${file?.fileType || ''}`.startsWith('image/');

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-bold text-ink">{title}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isImage ? (
            <img src={href} alt={title} className="h-52 w-full object-contain" />
          ) : (
            <div className="flex h-52 items-center justify-center text-sm font-semibold text-slate-500">Mở tệp PDF</div>
          )}
        </a>
      ) : (
        <div className="mt-3 flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">Không có tệp</div>
      )}
      <p className="mt-2 truncate text-xs text-slate-500">{file?.fileName || 'Chưa tải lên'}</p>
    </div>
  );
}

function KycAdminPanel() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem(TOKEN_KEY);

  const selected = useMemo(() => items.find((item) => item.id === selectedId) || items[0] || null, [items, selectedId]);

  const loadKyc = async () => {
    setLoading(true);
    setError('');
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const response = await fetch(`${KYC_API_BASE}/kyc${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Không tải được danh sách KYC');
      }
      const nextItems = Array.isArray(data) ? data : [];
      setItems(nextItems);
      if (!selectedId && nextItems[0]?.id) setSelectedId(nextItems[0].id);
    } catch (loadError) {
      setError(loadError instanceof TypeError ? 'Kh?ng k?t n?i ???c KYC service. H?y ch?y FastAPI ? port 8001.' : loadError.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKyc();
  }, [statusFilter]);

  const reviewKyc = async (action) => {
    if (!selected?.id) return;
    setError('');
    try {
      const response = await fetch(`${KYC_API_BASE}/kyc/${selected.id}/review`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, note: reviewNote }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Không cập nhật được KYC');
      }
      setItems((current) => current.map((item) => (item.id === data.id ? data : item)));
      setReviewNote('');
    } catch (reviewError) {
      setError(reviewError.message);
    }
  };

  return (
    <SectionCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="muted">Xác minh danh tính</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Duyệt hồ sơ KYC</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="UNDER_REVIEW">Đang xem xét</option>
            <option value="APPROVED">Đã xác minh</option>
            <option value="REJECTED">Từ chối</option>
          </select>
          <button onClick={loadKyc} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
            <RefreshCw className="h-4 w-4" /> Tải lại
          </button>
        </div>
      </div>

      {error ? <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-sm font-bold text-ink">Hàng chờ KYC</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{items.length} hồ sơ</span>
          </div>
          <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
            {loading ? <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Đang tải...</p> : null}
            {!loading && !items.length ? <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Chưa có hồ sơ KYC.</p> : null}
            {items.map((item) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border bg-white p-4 text-left transition ${selected?.id === item.id ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{item.fullName}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.userRole} - {item.documentType}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusTones[item.status] || statusTones.PENDING}`}>{statusLabels[item.status] || item.status}</span>
                </div>
                <p className="mt-3 text-xs text-slate-400">Gửi lúc {formatDate(item.submittedAt)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[680px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {selected ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Hồ sơ KYC</p>
                  <h3 className="mt-2 text-2xl font-bold text-ink">{selected.fullName}</h3>
                  <p className="mt-2 text-sm text-slate-500">User ID: {selected.userId}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTones[selected.status] || statusTones.PENDING}`}>{statusLabels[selected.status] || selected.status}</span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Giấy tờ</p>
                  <p className="mt-2 font-bold text-ink">{selected.documentType}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Số giấy tờ</p>
                  <p className="mt-2 font-bold text-ink">{selected.documentNumberMasked}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Quốc gia</p>
                  <p className="mt-2 font-bold text-ink">{selected.country}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-ink">Thông tin cá nhân</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p>Ngày sinh: {selected.dateOfBirth}</p>
                  <p>Vai trò: {selected.userRole}</p>
                  <p className="md:col-span-2">Địa chỉ: {selected.address}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <FilePreview title="Mặt trước giấy tờ" file={selected.documentFront} />
                <FilePreview title="Mặt sau giấy tờ" file={selected.documentBack} />
                <FilePreview title="Ảnh selfie" file={selected.selfie} />
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-ink">Ghi chú xử lý</p>
                <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={3} placeholder="Nhập lý do nếu từ chối hoặc yêu cầu gửi lại" className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <button onClick={() => reviewKyc('APPROVE')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Duyệt KYC
                  </button>
                  <button onClick={() => reviewKyc('REQUEST_RESUBMISSION')} className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50">
                    <ShieldAlert className="h-4 w-4" /> Yêu cầu gửi lại
                  </button>
                  <button onClick={() => reviewKyc('REJECT')} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50">
                    <XCircle className="h-4 w-4" /> Từ chối
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
              <FileCheck2 className="h-10 w-10 text-slate-400" />
              <p className="mt-3 font-bold text-ink">Chưa chọn hồ sơ KYC</p>
              <p className="mt-1 text-sm text-slate-500">Chọn một hồ sơ trong danh sách để xem giấy tờ và duyệt.</p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

export default KycAdminPanel;
