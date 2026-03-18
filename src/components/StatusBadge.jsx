const styles = {
  Pending: 'bg-gold/10 text-gold border-gold/20',
  Completed: 'bg-skyglass text-pine border-pine/20',
  Approved: 'bg-pine/10 text-pine border-pine/20',
  Held: 'bg-slate-100 text-slate-700 border-slate-200',
  Released: 'bg-pine/10 text-pine border-pine/20',
  Active: 'bg-pine/10 text-pine border-pine/20',
};

function StatusBadge({ status, dark = false, label }) {
  const base = dark
    ? 'border border-white/15 bg-white/10 text-white'
    : `border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${base}`}>
      {label || status}
    </span>
  );
}

export default StatusBadge;
