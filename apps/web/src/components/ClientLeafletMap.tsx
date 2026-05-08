'use client';

import dynamic from 'next/dynamic';
import type { Rating } from '../lib/api';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="pavemap-map-wrap">
      <div className="map-empty">
        <strong>Loading map</strong>
        <span>Preparing pavement rating layer.</span>
      </div>
    </div>
  ),
});

export function ClientLeafletMap({ ratings }: { ratings: Rating[] }) {
  return <LeafletMap ratings={ratings} />;
}
