import { ClientLeafletMap } from '../components/ClientLeafletMap';
import { JobsList } from '../components/JobsList';
import { RatingList } from '../components/RatingList';
import { ScanForm } from '../components/ScanForm';
import { StreetViewCheck } from '../components/StreetViewCheck';
import { getJobs, getRatings, getStats } from '../lib/api';

function formatAverage(value: string | null) {
  if (!value) return 'N/A';

  const average = Number(value);
  return Number.isFinite(average) ? average.toFixed(1) : 'N/A';
}

function formatPercent(value: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export default async function DashboardPage() {
  const [ratings, stats, jobs] = await Promise.all([getRatings(), getStats(), getJobs()]);
  const selected = ratings[0] ?? null;
  const completeJobs = stats.jobs.find((job) => job.status === 'complete')?.count ?? 0;
  const runningJobs = stats.jobs.find((job) => job.status === 'running')?.count ?? 0;
  const queuedJobs = stats.jobs.find((job) => job.status === 'queued')?.count ?? 0;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <span />
          </span>
          <strong>
            System<span>X</span>
          </strong>
        </div>

        <nav className="side-nav" aria-label="Dashboard navigation">
          <p>Workspace</p>
          <a className="active" href="#overview">
            Pavement Map <kbd>01</kbd>
          </a>
          <a href="#ratings">
            Ratings <kbd>02</kbd>
          </a>
          <a href="#jobs">
            Scan Jobs <kbd>03</kbd>
          </a>
          <a href="#street-view">
            Street View <kbd>04</kbd>
          </a>
        </nav>

        <div className="pipeline-health">
          <strong>Pipeline Health</strong>
          <span>
            <i className="green" />
            API
            <b>online</b>
          </span>
          <span>
            <i className={runningJobs ? 'amber' : 'green'} />
            Worker
            <b>{runningJobs ? 'active' : 'idle'}</b>
          </span>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="crumbs">
            <span>SystemX</span>
            <span>/</span>
            <b>Pavement Rating MVP</b>
          </div>

          <div className="top-actions">
            <label className="search-box">
              <span>Search</span>
              <input aria-label="Search segments" placeholder="SEG ID, status, condition" />
            </label>
            <span className="worker-pill">Worker ready</span>
            <span className="version-pill">v0.1</span>
            <span className="avatar">SX</span>
          </div>
        </header>

        <div className="dashboard">
          <section className="intro-row">
            <div>
              <div className="mode-row">
                <span>Sandbox mode</span>
                <small>temporary_processing_only</small>
              </div>
              <h1>AI pavement rating dashboard</h1>
              <p>
                Queue a demo scrape, review Street View coverage, and inspect pavement
                ratings as the worker writes scored road segments.
              </p>
            </div>

            <div className="intro-actions">
              <a className="outline-action" href="#ratings">
                View ratings
              </a>
              <a className="dark-action" href="#jobs">
                Start scan
              </a>
            </div>
          </section>

          <section className="metric-grid" aria-label="Pavement metrics">
            <article className="metric-card">
              <span>Total Segments</span>
              <strong>{stats.totals.total}</strong>
              <div>
                <p>Rated pavement points</p>
              </div>
            </article>

            <article className="metric-card">
              <span>Average Rating</span>
              <strong>{formatAverage(stats.totals.average_rating)}</strong>
              <div>
                <p>Out of 5.0 stars</p>
              </div>
            </article>

            <article className="metric-card">
              <span>Needs Review</span>
              <strong>{stats.totals.needs_review}</strong>
              <div>
                <p>{formatPercent(stats.totals.needs_review, stats.totals.total)} of results</p>
              </div>
            </article>

            <article className="metric-card">
              <span>Complete Jobs</span>
              <strong>{completeJobs}</strong>
              <div>
                <p>{runningJobs} running</p>
              </div>
            </article>

            <article className="metric-card">
              <span>Queued Jobs</span>
              <strong>{queuedJobs}</strong>
              <div>
                <p>Awaiting worker pickup</p>
              </div>
            </article>
          </section>

          <section className="overview-grid" id="overview">
            <article className="map-card">
              <div className="card-head">
                <div>
                  <h2>Live pavement map</h2>
                  <p>Street-level scoring by coordinate and condition class.</p>
                </div>
                <div className="filter-pills">
                  <span className="active">All</span>
                  <span>Review</span>
                  <span>Rated</span>
                </div>
              </div>

              <ClientLeafletMap ratings={ratings} />
            </article>

            <aside className="detail-card">
              {selected ? (
                <>
                  <div className="selected-top">
                    <div>
                      <span>Selected Segment</span>
                      <h2>SEG-{selected.id.slice(0, 5).toUpperCase()}</h2>
                      <p>
                        {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                      </p>
                    </div>
                    <b className={`condition-pill ${selected.needsHumanReview ? 'poor' : 'rated'}`}>
                      {selected.needsHumanReview ? 'review' : selected.status}
                    </b>
                  </div>

                  <div className="score-block">
                    <strong>{selected.stars ?? 'N/A'}</strong>
                    <span>/5</span>
                    <p>
                      Condition
                      <b>{selected.condition ?? 'Unlabeled'}</b>
                    </p>
                  </div>

                  <div className="capture-grid">
                    <div>north</div>
                    <div>east</div>
                    <div>south</div>
                    <div>west</div>
                  </div>

                  <div className="ai-bars">
                    <p>AI confidence</p>
                    <label>
                      pavement condition
                      <b>{Math.round(Number(selected.confidence ?? 0) * 100)}%</b>
                      <span>
                        <i style={{ width: `${Math.round(Number(selected.confidence ?? 0) * 100)}%` }} />
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <div className="empty-detail">
                  <strong>No selected segment</strong>
                  <p>Start a demo scan and refresh when the worker finishes.</p>
                </div>
              )}
            </aside>
          </section>

          <section className="data-grid">
            <article className="table-card" id="ratings">
              <div className="card-head compact">
                <div>
                  <h2>Recent ratings</h2>
                  <p>Latest pavement scores returned by the API.</p>
                </div>
              </div>
              <RatingList ratings={ratings} />
            </article>

            <aside className="side-stack">
              <article className="mini-card" id="jobs">
                <ScanForm />
              </article>

              <article className="mini-card">
                <div className="card-head compact">
                  <div>
                    <h2>Recent jobs</h2>
                    <p>Worker queue status.</p>
                  </div>
                </div>
                <JobsList jobs={jobs} />
              </article>

              <article className="mini-card" id="street-view">
                <StreetViewCheck />
              </article>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
