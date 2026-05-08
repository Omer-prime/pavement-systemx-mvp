import { env } from '../config/env.js';

export type StreetViewMetadata = {
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'REQUEST_DENIED' | 'OVER_QUERY_LIMIT' | string;
  pano_id?: string;
  date?: string;
  location?: { lat: number; lng: number };
  copyright?: string;
};

export type TemporaryStreetViewImage = {
  buffer: Buffer;
  contentType: string;
};

function createMockStreetViewSvg(lat: number, lng: number, heading: number) {
  return `
  <svg width="640" height="480" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#bfdbfe"/>
        <stop offset="100%" stop-color="#eff6ff"/>
      </linearGradient>
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#64748b"/>
        <stop offset="100%" stop-color="#334155"/>
      </linearGradient>
    </defs>

    <rect width="640" height="480" fill="url(#sky)" />
    <rect x="0" y="260" width="640" height="220" fill="url(#road)" />
    <path d="M0 320 C130 285 260 285 640 325" fill="none" stroke="#e2e8f0" stroke-width="18" opacity="0.8"/>
    <path d="M30 370 C180 340 300 340 610 380" fill="none" stroke="#f8fafc" stroke-width="6" stroke-dasharray="24 18"/>
    <path d="M120 280 L170 245 L220 280 Z" fill="#94a3b8"/>
    <path d="M340 280 L410 225 L500 280 Z" fill="#64748b"/>
    <circle cx="90" cy="95" r="44" fill="#facc15" opacity="0.95"/>

    <rect x="34" y="34" width="572" height="110" rx="24" fill="rgba(15,23,42,0.76)"/>
    <text x="58" y="78" font-family="Arial" font-size="28" fill="#ffffff" font-weight="700">
      Mock Street View Preview
    </text>
    <text x="58" y="116" font-family="Arial" font-size="17" fill="#dbeafe">
      lat ${lat.toFixed(5)} · lng ${lng.toFixed(5)} · heading ${heading}°
    </text>

    <rect x="34" y="396" width="572" height="48" rx="16" fill="rgba(255,255,255,0.86)"/>
    <text x="58" y="427" font-family="Arial" font-size="18" fill="#0f172a" font-weight="700">
      Temporary processing preview only — not stored permanently
    </text>
  </svg>`;
}

export async function getStreetViewMetadata(
  lat: number,
  lng: number,
  heading = 0,
): Promise<StreetViewMetadata> {
  if (env.MOCK_EXTERNAL_APIS) {
    return {
      status: 'OK',
      pano_id: `mock-pano-${lat}-${lng}-${heading}`,
      date: '2025-01',
      location: { lat, lng },
      copyright: 'Mock mode',
    };
  }

  if (!env.GOOGLE_STREET_VIEW_API_KEY) {
    throw new Error('GOOGLE_STREET_VIEW_API_KEY is missing');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/streetview/metadata');
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('heading', String(heading));
  url.searchParams.set('radius', String(env.STREET_VIEW_RADIUS_METERS));
  url.searchParams.set('key', env.GOOGLE_STREET_VIEW_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Street View metadata request failed: ${response.status}`);
  }

  return (await response.json()) as StreetViewMetadata;
}

export async function fetchTemporaryStreetViewImage(
  lat: number,
  lng: number,
  heading: number,
): Promise<TemporaryStreetViewImage> {
  if (env.MOCK_EXTERNAL_APIS) {
    return {
      buffer: Buffer.from(createMockStreetViewSvg(lat, lng, heading)),
      contentType: 'image/svg+xml',
    };
  }

  if (!env.GOOGLE_STREET_VIEW_API_KEY) {
    throw new Error('GOOGLE_STREET_VIEW_API_KEY is missing');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/streetview');
  url.searchParams.set('size', env.STREET_VIEW_IMAGE_SIZE);
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('heading', String(heading));
  url.searchParams.set('pitch', '-30');
  url.searchParams.set('fov', '90');
  url.searchParams.set('radius', String(env.STREET_VIEW_RADIUS_METERS));
  url.searchParams.set('key', env.GOOGLE_STREET_VIEW_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Street View image request failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get('content-type') ?? 'image/jpeg',
  };
}