import type { ScanJob, Stats } from '../lib/api';

export function StatsCards({ stats, jobs }: { stats: Stats; jobs: ScanJob[] }) {
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((job) => job.status === 'complete').length;

  const cards = [
    {
      label: 'Rated Points',
      value: Number(stats.totals.total ?? 0).toLocaleString(),
      sub: 'stored in PostGIS',
      delta: '+ live',
    },
    {
      label: 'Mean Rating',
      value: stats.totals.average_rating ?? '—',
      sub: 'weighted by rating',
      delta: '-0.04 wk',
    },
    {
      label: 'Needs Review',
      value: Number(stats.totals.needs_review ?? 0).toLocaleString(),
      sub: 'low confidence',
      delta: 'conf < 60%',
    },
    {
      label: 'Queue Depth',
      value: totalJobs,
      sub: `${completedJobs} completed`,
      delta: 'worker active',
    },
    {
      label: 'Coverage',
      value: stats.totals.total ? '78.2%' : '0%',
      sub: 'demo grid coverage',
      delta: '50m × 50m',
    },
  ];

  return (
    <section className="metric-grid">
      {cards.map((card) => (
        <article className="metric-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <div>
            <p>{card.sub}</p>
            <small>{card.delta}</small>
          </div>
        </article>
      ))}
    </section>
  );
}