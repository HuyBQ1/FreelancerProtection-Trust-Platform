import { ArrowUpRight, BriefcaseBusiness, CircleDollarSign } from 'lucide-react';

function JobCard({ job, labels }) {
  return (
    <article className="panel p-6 transition hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="chip">{job.category}</span>
          <h3 className="mt-4 text-xl font-semibold text-ink">{job.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{job.description}</p>
        </div>
        <button className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
          <ArrowUpRight className="h-5 w-5" />
        </button>
      </div>

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
