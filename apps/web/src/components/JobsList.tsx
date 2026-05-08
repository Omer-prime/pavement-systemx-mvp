import type { ScanJob } from '../lib/api';

function statusClass(status: string) {
  if (status === 'complete') return 'complete';
  if (status === 'running') return 'running';
  if (status === 'failed') return 'failed';
  return 'queued';
}

export function JobsList({ jobs }: { jobs: ScanJob[] }) {
  if (!jobs.length) {
    return (
      <div className="mini-empty">
        <strong>No scan jobs</strong>
        <span>Queue a demo scan.</span>
      </div>
    );
  }

  return (
    <div className="compact-jobs">
      {jobs.slice(0, 5).map((job) => (
        <article key={job.id}>
          <div>
            <strong>{job.areaName}</strong>
            <span>
              {job.completed}/{job.totalPoints} complete · {job.failed} failed
            </span>
          </div>

          <span className={`job-chip ${statusClass(job.status)}`}>{job.status}</span>
        </article>
      ))}
    </div>
  );
}