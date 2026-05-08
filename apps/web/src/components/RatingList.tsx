import type { Rating } from '../lib/api';

function scoreClass(stars: number | null) {
  if (!stars) return 'unknown';
  if (stars >= 4) return 'good';
  if (stars >= 2.5) return 'fair';
  return 'poor';
}

function confidenceValue(confidence: Rating['confidence']) {
  const value = Number(confidence ?? 0);
  if (Number.isNaN(value)) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

export function RatingList({ ratings }: { ratings: Rating[] }) {
  if (!ratings.length) {
    return (
      <div className="empty-table-state">
        <strong>No ratings yet</strong>
        <span>Start a demo scan and wait for the worker to complete it.</span>
      </div>
    );
  }

  return (
    <div className="ratings-table-wrap">
      <table className="ratings-table">
        <thead>
          <tr>
            <th>Seg ID</th>
            <th>Location</th>
            <th>Score</th>
            <th>Conf</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {ratings.map((rating) => (
            <tr key={rating.id}>
              <td className="mono">0{rating.id.slice(0, 4).toUpperCase()}</td>
              <td>
                <strong>{rating.condition ?? 'Pavement segment'}</strong>
                <small>{rating.notes ?? `${rating.lat.toFixed(5)}, ${rating.lng.toFixed(5)}`}</small>
              </td>
              <td>
                <span className={`score-dot ${scoreClass(rating.stars)}`} />
                <b>{rating.stars ?? '—'}</b>
              </td>
              <td>
                <div className="conf-line">
                  <i style={{ width: confidenceValue(rating.confidence) }} />
                </div>
                <small>{confidenceValue(rating.confidence)}</small>
              </td>
              <td>
                {rating.needsHumanReview ? (
                  <span className="status-chip review">● review</span>
                ) : (
                  <span className="status-chip rated">● rated</span>
                )}
              </td>
              <td className="mono">
                {rating.ratedAt
                  ? new Date(rating.ratedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'now'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}