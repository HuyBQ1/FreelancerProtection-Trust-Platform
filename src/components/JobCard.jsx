import { ArrowUpRight } from 'lucide-react';
import { normalizeMoneyDisplay } from '../utils/money';

function JobCard({ job, labels, actionLabel, onAction, selected = false }) {
  const interactive = typeof onAction === 'function';
  const detailChips = [
    job.experienceLevel,
    job.engagementType,
    job.locationType,
    job.timeline,
  ].filter(Boolean);
  const shortDescription = [job.description, job.scopeSummary].filter(Boolean).join(' ');

  return (
    <article
      onClick={interactive ? onAction : undefined}
      className={`panel p-6 transition ${interactive ? 'cursor-pointer hover:-translate-y-1' : ''} ${
        selected ? 'border border-pine/40 ring-2 ring-pine/20' : ''
      }`}
    >
      <div className="space-y-6">
        <div className="min-w-0">
          <h3 className="text-2xl font-semibold text-ink">{job.title}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span>{job.timeline || 'Flexible'}</span>
            <span className="font-semibold text-emerald-600">{job.category}</span>
            {job.client ? <span>{job.client}</span> : null}
          </div>

          <p className="mt-4 line-clamp-5 max-w-5xl text-base leading-8 text-slate-700">{shortDescription}</p>

          {Array.isArray(job.skills) && job.skills.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {job.skills.slice(0, 8).map((skill) => (
                <span key={skill} className="text-sm font-medium text-sky-700">
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:items-center lg:gap-8">
            <div>
              <p className="text-2xl font-bold text-ink">{normalizeMoneyDisplay(job.budget)}</p>
              <p className="mt-1 text-sm text-slate-500">{labels.budget}</p>
            </div>

            <div>
              <p className="text-lg font-semibold text-ink">{job.client}</p>
              <p className="mt-1 text-sm text-slate-500">{labels.client}</p>
            </div>

            {detailChips.length > 0 ? (
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap lg:max-w-[360px]">
                {detailChips.map((chip) => (
                  <span key={chip} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {actionLabel ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAction?.();
              }}
              disabled={!interactive}
              className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                interactive
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'cursor-default bg-slate-200 text-slate-400'
              }`}
            >
              <span className="whitespace-nowrap">{actionLabel}</span>
              <ArrowUpRight className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default JobCard;
