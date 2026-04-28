import { ArrowUpRight, BriefcaseBusiness, CircleDollarSign } from 'lucide-react';

function JobCard({ job, labels, actionLabel, onAction, selected = false }) {
  const interactive = typeof onAction === 'function';
  const detailChips = [
    job.experienceLevel,
    job.engagementType,
    job.locationType,
    job.timeline,
  ].filter(Boolean);

  return (
    <article
      onClick={interactive ? onAction : undefined}
      className={`panel p-6 transition ${interactive ? 'cursor-pointer hover:-translate-y-1' : ''} ${
        selected ? 'border border-pine/40 ring-2 ring-pine/20' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="chip">{job.category}</span>
          <h3 className="mt-4 text-xl font-semibold text-ink">{job.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{job.description}</p>
          {job.scopeSummary ? <p className="mt-3 text-sm leading-6 text-slate-500">{job.scopeSummary}</p> : null}
        </div>
        {actionLabel ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAction?.();
            }}
            disabled={!interactive}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-3 transition ${
              interactive
                ? 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                : 'cursor-default border-slate-200 bg-slate-50 text-slate-400'
            }`}
          >
            <span className={`text-sm font-semibold ${interactive ? 'text-slate-700' : 'text-slate-500'}`}>{actionLabel}</span>
            <ArrowUpRight className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {detailChips.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {detailChips.map((chip) => (
            <span key={chip} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {Array.isArray(job.skills) && job.skills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.slice(0, 6).map((skill) => (
            <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <CircleDollarSign className="h-4 w-4 text-pine" />
            {labels.budget}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{job.budget}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <BriefcaseBusiness className="h-4 w-4 text-pine" />
            {labels.client}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{job.client}</p>
        </div>
      </div>
    </article>
  );
}

export default JobCard;
