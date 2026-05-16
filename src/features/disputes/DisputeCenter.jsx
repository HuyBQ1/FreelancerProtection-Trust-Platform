import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileImage, FileText, LockKeyhole, MessageSquareText, RefreshCw, Send, ShieldAlert, Upload } from 'lucide-react';
import { disputeApi } from './disputeApi';

const categoryLabels = {
  PAYMENT_NOT_RELEASED: 'Chưa giải ngân thanh toán',
  POOR_DELIVERABLE_QUALITY: 'Chất lượng bàn giao kém',
  MISSED_DEADLINE: 'Trễ hạn',
  CONTRACT_VIOLATION: 'Vi phạm hợp đồng',
  FRAUD_SUSPICIOUS_BEHAVIOR: 'Nghi ngờ gian lận',
};

const statusLabels = {
  OPEN: 'Đang mở',
  WAITING_RESPONSE: 'Chờ phản hồi',
  UNDER_REVIEW: 'Đang xem xét',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
};

const statusTones = {
  OPEN: 'bg-rose-50 text-rose-700 border-rose-100',
  WAITING_RESPONSE: 'bg-amber-50 text-amber-700 border-amber-100',
  UNDER_REVIEW: 'bg-sky-50 text-sky-700 border-sky-100',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
};

const evidenceTypes = {
  IMAGE: 'Hình ảnh',
  PDF: 'PDF',
  DELIVERABLE: 'Sản phẩm bàn giao',
  GITHUB_LINK: 'Liên kết GitHub',
  CHAT_HISTORY: 'Lịch sử trò chuyện',
};

const adminActions = {
  REQUEST_CLARIFICATION: 'Yêu cầu làm rõ',
  FREEZE_ESCROW: 'Đóng băng escrow',
  APPROVE_FREELANCER: 'Duyệt cho freelancer',
  APPROVE_CLIENT: 'Duyệt cho client',
  CLOSE_DISPUTE: 'Đóng tranh chấp',
};

function cleanContractId(contract) {
  return `${contract?.sourceJobId || contract?.id || ''}`.replace(/^job-contract-/, '');
}

function formatDate(value) {
  if (!value) return 'Vừa tạo';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Vừa tạo';
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(`${reader.result || ''}`);
    reader.onerror = () => reject(new Error('Could not read evidence file'));
    reader.readAsDataURL(file);
  });
}

function isImageEvidence(entry) {
  return entry?.evidenceType === 'IMAGE' || `${entry?.fileType || ''}`.startsWith('image/') || `${entry?.fileUrl || ''}`.startsWith('data:image/');
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusTones[status] || statusTones.CLOSED}`}>
      {statusLabels[status] || status}
    </span>
  );
}

function DisputeCenter({ role = 'client', contracts = [] }) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    contractId: '',
    milestoneId: '',
    category: 'PAYMENT_NOT_RELEASED',
    title: '',
    description: '',
  });
  const [createEvidence, setCreateEvidence] = useState({ evidenceType: 'IMAGE', fileUrl: '', fileName: '', fileType: '', description: '' });
  const [evidence, setEvidence] = useState({ evidenceType: 'IMAGE', fileUrl: '', fileName: '', fileType: '', description: '' });
  const [response, setResponse] = useState('');
  const [adminForm, setAdminForm] = useState({ status: 'UNDER_REVIEW', adminAction: 'REQUEST_CLARIFICATION', resolution: '' });

  const canCreate = role === 'client' || role === 'freelancer';
  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) || items[0] || null, [items, selectedId]);
  const selectedContract = contracts.find((contract) => cleanContractId(contract) === form.contractId) || contracts[0] || null;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const nextItems = await disputeApi.list();
      setItems(nextItems);
      if (!selectedId && nextItems[0]?.id) {
        setSelectedId(nextItems[0].id);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    if (!id) {
      setSelectedDetail(null);
      return;
    }

    setDetailLoading(true);
    try {
      const detail = await disputeApi.detail(id);
      setSelectedDetail(detail);
      setAdminForm({
        status: detail.status || 'UNDER_REVIEW',
        adminAction: detail.adminAction || 'REQUEST_CLARIFICATION',
        resolution: detail.resolution || '',
      });
    } catch (detailError) {
      setError(detailError.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!form.contractId && contracts[0]) {
      setForm((current) => ({ ...current, contractId: cleanContractId(contracts[0]) }));
    }
  }, [contracts, form.contractId]);

  useEffect(() => {
    if (selectedItem?.id) {
      loadDetail(selectedItem.id);
    }
  }, [selectedItem?.id]);

  const createDispute = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.contractId || !form.title.trim() || form.description.trim().length < 10) {
      setError('Vui lòng chọn dự án, nhập tiêu đề và mô tả ít nhất 10 ký tự.');
      return;
    }

    try {
      const created = await disputeApi.create(form);
      if (createEvidence.fileUrl.trim()) {
        await disputeApi.addEvidence(created.id, {
          ...createEvidence,
          description: createEvidence.description || 'Bằng chứng gửi cùng lúc tạo tranh chấp',
        });
      }
      setItems((current) => [created, ...current]);
      setSelectedId(created.id);
      await loadDetail(created.id);
      setForm((current) => ({ ...current, milestoneId: '', title: '', description: '' }));
      setCreateEvidence({ evidenceType: 'IMAGE', fileUrl: '', fileName: '', fileType: '', description: '' });
    } catch (createError) {
      setError(createError.message);
    }
  };

  const submitEvidence = async (event) => {
    event.preventDefault();
    if (!selectedDetail?.id || !evidence.fileUrl.trim()) return;

    try {
      await disputeApi.addEvidence(selectedDetail.id, evidence);
      setEvidence({ evidenceType: 'IMAGE', fileUrl: '', fileName: '', fileType: '', description: '' });
      await loadDetail(selectedDetail.id);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const handleEvidenceFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Ảnh hoặc tệp bằng chứng không được vượt quá 8MB.');
      event.target.value = '';
      return;
    }

    try {
      const fileUrl = await readFileAsDataUrl(file);
      setEvidence((current) => ({
        ...current,
        evidenceType: file.type.startsWith('image/') ? 'IMAGE' : current.evidenceType,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
      }));
      setError('');
    } catch (fileError) {
      setError(fileError.message);
    } finally {
      event.target.value = '';
    }
  };

  const handleCreateEvidenceFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Ảnh hoặc tệp bằng chứng không được vượt quá 8MB.');
      event.target.value = '';
      return;
    }

    try {
      const fileUrl = await readFileAsDataUrl(file);
      setCreateEvidence((current) => ({
        ...current,
        evidenceType: file.type.startsWith('image/') ? 'IMAGE' : current.evidenceType,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
      }));
      setError('');
    } catch (fileError) {
      setError(fileError.message);
    } finally {
      event.target.value = '';
    }
  };

  const submitResponse = async () => {
    if (!selectedDetail?.id || !response.trim()) return;

    try {
      const result = await disputeApi.addResponse(selectedDetail.id, { message: response });
      setResponse('');
      setSelectedDetail(result.dispute);
      await load();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const updateStatus = async () => {
    if (!selectedDetail?.id) return;

    try {
      const updated = await disputeApi.updateStatus(selectedDetail.id, adminForm);
      setSelectedDetail(updated);
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Trung tâm tranh chấp</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Quản lý tranh chấp hợp đồng</h2>
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
          <RefreshCw size={16} /> Tải lại
        </button>
      </div>

      {error ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      {canCreate ? (
        <form onSubmit={createDispute} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={20} />
            <h3 className="text-lg font-black text-ink">Tạo tranh chấp mới</h3>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_1fr]">
            <select value={form.contractId} onChange={(event) => setForm({ ...form, contractId: event.target.value, milestoneId: '' })} className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {contracts.length ? contracts.map((contract) => (
                <option key={cleanContractId(contract)} value={cleanContractId(contract)}>
                  {contract.title?.vi || contract.title?.en || contract.title || 'Dự án'}
                </option>
              )) : <option value="">Chưa có hợp đồng đang hoạt động</option>}
            </select>
            <select value={form.milestoneId} onChange={(event) => setForm({ ...form, milestoneId: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none">
              <option value="">Toàn bộ hợp đồng</option>
              {(selectedContract?.milestones || []).map((milestone, index) => (
                <option key={`${index}`} value={`${index}`}>
                  Mốc {index + 1}: {milestone.title?.vi || milestone.title?.en || `Milestone ${index + 1}`}
                </option>
              ))}
            </select>
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none">
              {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Tiêu đề tranh chấp" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Mô tả vấn đề, số tiền hoặc mốc bị ảnh hưởng" rows={3} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <div className="mt-3 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-100">
              <Upload size={16} />
              Chọn ảnh bằng chứng
              <input type="file" accept="image/*,.pdf,.txt,.md,.json,.zip" onChange={handleCreateEvidenceFile} className="hidden" />
            </label>
            <input value={createEvidence.fileUrl.startsWith('data:') ? '' : createEvidence.fileUrl} onChange={(event) => setCreateEvidence({ ...createEvidence, fileUrl: event.target.value, fileName: '', fileType: '' })} placeholder="Hoặc dán link bằng chứng" className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          </div>
          {createEvidence.fileName ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              Đã chọn: {createEvidence.fileName}
            </div>
          ) : null}
          {createEvidence.fileUrl.startsWith('data:image/') ? (
            <img src={createEvidence.fileUrl} alt={createEvidence.fileName || 'Ảnh bằng chứng'} className="mt-3 max-h-48 w-full rounded-xl border border-slate-200 object-contain" />
          ) : null}
          <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={!contracts.length}>
            <AlertTriangle size={16} /> Gửi tranh chấp
          </button>
        </form>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-black text-ink">Danh sách tranh chấp</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{items.length}</span>
          </div>
          <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {loading ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Đang tải...</p> : null}
            {!loading && !items.length ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có tranh chấp nào.</p> : null}
            {items.map((item) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedItem?.id === item.id ? 'border-ink bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-ink">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{categoryLabels[item.category] || item.category}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <p className="mt-3 text-xs font-semibold text-slate-400">{formatDate(item.updatedAt || item.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedDetail ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">Chọn một tranh chấp để xem chi tiết.</div>
          ) : detailLoading ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">Đang tải chi tiết...</div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <StatusBadge status={selectedDetail.status} />
                  <h3 className="mt-3 text-2xl font-black text-ink">{selectedDetail.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selectedDetail.description}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <p className="font-bold text-slate-900">Người tạo: {selectedDetail.raisedByName}</p>
                  <p className="mt-1 text-slate-500">Bị khiếu nại: {selectedDetail.againstUserName}</p>
                </div>
              </div>

              {role === 'admin' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2">
                    <LockKeyhole size={18} className="text-amber-700" />
                    <p className="font-black text-amber-900">Xử lý của admin</p>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <select value={adminForm.status} onChange={(event) => setAdminForm({ ...adminForm, status: event.target.value })} className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm">
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <select value={adminForm.adminAction} onChange={(event) => setAdminForm({ ...adminForm, adminAction: event.target.value })} className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm">
                      {Object.entries(adminActions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                  <textarea value={adminForm.resolution} onChange={(event) => setAdminForm({ ...adminForm, resolution: event.target.value })} rows={3} placeholder="Ghi chú kết luận hoặc yêu cầu làm rõ" className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm" />
                  <button onClick={updateStatus} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white">
                    <CheckCircle2 size={16} /> Cập nhật xử lý
                  </button>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <form onSubmit={submitEvidence} className="rounded-xl border border-slate-200 p-4">
                  <p className="flex items-center gap-2 font-black text-ink"><FileText size={17} /> Bằng chứng</p>
                  <select value={evidence.evidenceType} onChange={(event) => setEvidence({ ...evidence, evidenceType: event.target.value })} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    {Object.entries(evidenceTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-100">
                    <Upload size={16} />
                    Chọn ảnh hoặc tệp từ máy
                    <input type="file" accept="image/*,.pdf,.txt,.md,.json,.zip" onChange={handleEvidenceFile} className="hidden" />
                  </label>
                  {evidence.fileName ? (
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                      Đã chọn: {evidence.fileName}
                    </div>
                  ) : null}
                  {evidence.fileUrl.startsWith('data:image/') ? (
                    <img src={evidence.fileUrl} alt={evidence.fileName || 'Ảnh bằng chứng'} className="mt-3 max-h-48 w-full rounded-xl border border-slate-200 object-contain" />
                  ) : null}
                  <input value={evidence.fileUrl} onChange={(event) => setEvidence({ ...evidence, fileUrl: event.target.value })} placeholder="Link file, GitHub hoặc đoạn chat" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                  <textarea value={evidence.description} onChange={(event) => setEvidence({ ...evidence, description: event.target.value })} rows={2} placeholder="Mô tả ngắn" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                  <button className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Lưu bằng chứng</button>
                </form>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="flex items-center gap-2 font-black text-ink"><MessageSquareText size={17} /> Phản hồi</p>
                  <textarea value={response} onChange={(event) => setResponse(event.target.value)} rows={5} placeholder="Nhập phản hồi hoặc yêu cầu làm rõ" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                  <button onClick={submitResponse} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">
                    <Send size={15} /> Gửi phản hồi
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="font-black text-ink">Bằng chứng đã gửi</p>
                  <div className="mt-3 space-y-2">
                    {(selectedDetail.evidence || []).map((entry) => (
                      <a key={entry.id} href={entry.fileUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50">
                        <p className="flex items-center gap-2 font-bold text-ink">
                          {isImageEvidence(entry) ? <FileImage size={16} /> : <FileText size={16} />}
                          {evidenceTypes[entry.evidenceType] || entry.evidenceType}
                        </p>
                        {isImageEvidence(entry) ? (
                          <img src={entry.fileUrl} alt={entry.fileName || 'Ảnh bằng chứng'} className="mt-3 max-h-56 w-full rounded-xl border border-slate-200 object-contain" />
                        ) : null}
                        <p className="mt-2 break-all text-slate-500">{entry.fileName || (entry.fileUrl.startsWith('data:') ? 'Tệp đã tải lên' : entry.fileUrl)}</p>
                        <p className="mt-1 text-xs text-slate-400">{entry.uploadedByName} - {formatDate(entry.createdAt)}</p>
                      </a>
                    ))}
                    {!selectedDetail.evidence?.length ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chưa có bằng chứng.</p> : null}
                  </div>
                </div>
                <div>
                  <p className="font-black text-ink">Trao đổi</p>
                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {(selectedDetail.responses || []).map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-ink">{entry.senderName}</p>
                          <p className="text-xs text-slate-400">{formatDate(entry.createdAt)}</p>
                        </div>
                        <p className="mt-2 leading-6 text-slate-600">{entry.message}</p>
                      </div>
                    ))}
                    {!selectedDetail.responses?.length ? <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chưa có phản hồi.</p> : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DisputeCenter;
