'use client';

import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { Rating } from '../lib/api';

const colorByStars: Record<number, string> = {
  5: '#2f6f3e',
  4: '#2f6f3e',
  3: '#c48318',
  2: '#9f3126',
  1: '#9f3126',
};

function getMarkerColor(stars: number | null) {
  if (!stars) return '#7a756c';
  return colorByStars[stars] ?? '#7a756c';
}

function getConfidence(confidence: Rating['confidence']) {
  const value = Number(confidence ?? 0);
  if (Number.isNaN(value)) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

function FitMapToRatings({ ratings }: { ratings: Rating[] }) {
  const map = useMap();

  useEffect(() => {
    const valid = ratings.filter((rating) => Number.isFinite(rating.lat) && Number.isFinite(rating.lng));
    if (!valid.length) return;

    map.fitBounds(
      valid.map((rating) => [rating.lat, rating.lng] as [number, number]),
      { padding: [36, 36], maxZoom: 15 },
    );
  }, [map, ratings]);

  return null;
}

export default function LeafletMap({ ratings }: { ratings: Rating[] }) {
  const validRatings = ratings.filter((rating) => Number.isFinite(rating.lat) && Number.isFinite(rating.lng));

  const center: LatLngExpression = validRatings.length
    ? [
        validRatings.reduce((total, rating) => total + rating.lat, 0) / validRatings.length,
        validRatings.reduce((total, rating) => total + rating.lng, 0) / validRatings.length,
      ]
    : [51.5074, -0.1278];

  return (
    <div className="pavemap-map-wrap">
      <MapContainer center={center} zoom={14} scrollWheelZoom className="pavemap-map">
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapToRatings ratings={validRatings} />

        {validRatings.map((rating) => (
          <CircleMarker
            key={rating.id}
            center={[rating.lat, rating.lng]}
            radius={rating.needsHumanReview ? 17 : 12}
            pathOptions={{
              color: rating.needsHumanReview ? 'rgba(159, 49, 38, 0.35)' : '#ffffff',
              weight: rating.needsHumanReview ? 10 : 3,
              fillColor: getMarkerColor(rating.stars),
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="map-popup">
                <span>SEG-{rating.id.slice(0, 5).toUpperCase()}</span>
                <strong>{rating.stars ?? '—'} / 5.0</strong>
                <p>{rating.condition ?? rating.status}</p>
                <small>
                  conf {getConfidence(rating.confidence)}
                  <br />
                  {rating.lat.toFixed(5)}, {rating.lng.toFixed(5)}
                </small>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="coord-pill">40.7128° N · 74.0060° W</div>

      <div className="grade-legend">
        <b>Pavement Grade</b>
        <span><i className="excellent" /> Excellent 4.0 - 5.0</span>
        <span><i className="fair" /> Fair 2.5 - 3.9</span>
        <span><i className="poor" /> Poor 0.0 - 2.4</span>
      </div>

      <div className="zoom-box">
        <button>+</button>
        <button>−</button>
        <button>⌖</button>
      </div>

      <div className="scale-box">
        <i />
        <span>500 m</span>
      </div>

      {!validRatings.length ? (
        <div className="map-empty">
          <strong>No rating points yet</strong>
          <span>Start scan → worker completes → refresh dashboard.</span>
        </div>
      ) : null}
    </div>
  );
}