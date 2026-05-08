export type LatLng = { lat: number; lng: number };
export type Bounds = { north: number; south: number; east: number; west: number };

const EARTH_RADIUS_METERS = 6_371_000;

export function generateGridPoints(bounds: Bounds, intervalMeters: number, maxPoints: number): LatLng[] {
  const latStep = (intervalMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const midLat = (bounds.north + bounds.south) / 2;
  const lngStep = latStep / Math.cos((midLat * Math.PI) / 180);

  const points: LatLng[] = [];
  for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
    for (let lng = bounds.west; lng <= bounds.east; lng += lngStep) {
      points.push({ lat: roundCoord(lat), lng: roundCoord(lng) });
      if (points.length >= maxPoints) return points;
    }
  }

  return points;
}

export function roundCoord(value: number) {
  return Number(value.toFixed(6));
}
