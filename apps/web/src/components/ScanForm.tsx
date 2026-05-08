'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function ScanForm() {
  const router = useRouter();
  const [message, setMessage] = useState('Ready to queue a sandbox scan.');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  function refreshDashboard() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function startDemoScan() {
    setLoading(true);
    setMessage('Creating scrape job...');

    try {
      const response = await fetch(`${API_URL}/api/jobs/scan`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          areaName: 'Manhattan · Lower Demo',
          confirmCost: true,
          points: [
            { lat: 40.71862, lng: -73.9941 },
            { lat: 40.71935, lng: -73.9952 },
            { lat: 40.7178, lng: -73.9964 },
            { lat: 40.7169, lng: -73.9928 },
            { lat: 40.7201, lng: -73.9934 },
            { lat: 40.721, lng: -73.997 },
          ],
          headings: [0],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Scan failed');

      setMessage(`Queued ${data.points} point scrape · job ${data.jobId.slice(0, 8)}`);

      window.setTimeout(() => {
        refreshDashboard();
      }, 2200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="scrape-box">
      <div>
        <span>Scrape Control</span>
        <h3>New sandbox scrape</h3>
        <p>{message}</p>
      </div>

      <button onClick={startDemoScan} disabled={loading} className="dark-action full">
        {loading ? 'Starting...' : 'New scrape'}
      </button>

      <button className="outline-action full" onClick={refreshDashboard} disabled={isPending}>
        {isPending ? 'Refreshing...' : 'Refresh dashboard'}
      </button>
    </div>
  );
}