import type { Rating } from '../lib/api';

const colorByStars: Record<number, string> = {
  5: '#22C55E',
  4: '#86EFAC',
  3: '#EAB308',
  2: '#F97316',
  1: '#EF4444',
};

export function MvpMap({ ratings }: { ratings: Rating[] }) {
  const validRatings = ratings.filter((rating) => rating.lat && rating.lng);

  return (
    <div className="map-placeholder" aria-label="MVP map placeholder">
      {validRatings.slice(0, 80).map((rating, index) => {
        const left = 10 + ((index * 17) % 80);
        const top = 12 + ((index * 23) % 72);
        const color = rating.stars ? colorByStars[rating.stars] : '#64748b';
        return (
          <span
            key={rating.id}
            className="marker"
            title={`${rating.condition ?? rating.status} - ${rating.stars ?? 'N/A'} stars`}
            style={{ left: `${left}%`, top: `${top}%`, background: color }}
          />
        );
      })}
    </div>
  );
}
