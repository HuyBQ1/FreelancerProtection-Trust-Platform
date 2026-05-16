const tones = {
  OPEN: 'bg-rose-100 text-rose-700',
  WAITING_RESPONSE: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-sky-100 text-sky-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-700',
};

const labels = {
  OPEN: 'Đang mở',
  WAITING_RESPONSE: 'Chờ phản hồi',
  UNDER_REVIEW: 'Đang xem xét',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
};

function DisputeStatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[status] || tones.CLOSED}`}>
      {labels[status] || status}
    </span>
  );
}

export default DisputeStatusBadge;
