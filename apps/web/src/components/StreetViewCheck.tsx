'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type StreetViewCheckResult = {
  mode: 'mock' | 'live_google' | string;
  hasCoverage: boolean;
  temporaryPreviewUrl: string | null;
  metadata: {
    status: string;
    pano_id?: string;
    date?: string;
    location?: { lat: number; lng: number };
    copyright?: string;
  };
  storagePolicy: string;
};

export function StreetViewCheck() {
  const [lat, setLat] = useState('51.5074');
  const [lng, setLng] = useState('-0.1278');
  const [heading, setHeading] = useState('0');
  const [result, setResult] = useState<StreetViewCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkCoverage() {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        lat,
        lng,
        heading,
      });

      const response = await fetch(`${API_URL}/api/street-view/check?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'Street View check failed');
      }

      setResult(data);
    } catch (error) {
      setResult({
        mode: 'error',
        hasCoverage: false,
        temporaryPreviewUrl: null,
        metadata: {
          status: error instanceof Error ? error.message : 'Unknown error',
        },
        storagePolicy: 'temporary_processing_only',
      });
    } finally {
      setLoading(false);
    }
  }

  const previewSrc = result?.temporaryPreviewUrl
    ? `${API_URL}${result.temporaryPreviewUrl}`
    : null;

  return (
    <div className="street-check-card">
      <div className="street-check-heading">
        <span className="panel-kicker">Street View</span>
        <h3>Coverage Check</h3>
        <p>Verify if a coordinate has Street View before spending image/AI cost.</p>
      </div>

      <div className="street-check-grid">
        <label>
          Latitude
          <input value={lat} onChange={(event) => setLat(event.target.value)} />
        </label>

        <label>
          Longitude
          <input value={lng} onChange={(event) => setLng(event.target.value)} />
        </label>

        <label>
          Heading
          <select value={heading} onChange={(event) => setHeading(event.target.value)}>
            <option value="0">0° North</option>
            <option value="90">90° East</option>
            <option value="180">180° South</option>
            <option value="270">270° West</option>
          </select>
        </label>
      </div>

      <button className="street-check-button" onClick={checkCoverage} disabled={loading}>
        {loading ? 'Checking...' : 'Check Street View'}
      </button>

      {result ? (
        <div className="street-check-result">
          <div>
            <strong>{result.hasCoverage ? 'Coverage found' : 'No coverage'}</strong>
            <span>Mode: {result.mode}</span>
            <span>Status: {result.metadata.status}</span>
            {result.metadata.pano_id ? <span>Pano ID: {result.metadata.pano_id}</span> : null}
            {result.metadata.date ? <span>Date: {result.metadata.date}</span> : null}
            <span>Storage: {result.storagePolicy}</span>
          </div>

          {previewSrc ? (
            <img src={previewSrc} alt="Temporary Street View preview" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}