const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type Rating = {
  id: string;
  scanJobId?: string;
  lat: number;
  lng: number;
  heading: number;
  stars: number | null;
  condition: string | null;
  notes: string | null;
  issues: string[];
  confidence: string | number | null;
  needsHumanReview: boolean;
  status: string;
  ratedAt?: string | null;
  createdAt?: string | null;
};

export type Stats = {
  totals: {
    total: number;
    average_rating: string | null;
    needs_review: number;
  };
  breakdown: Array<{ condition: string | null; count: number }>;
  jobs: Array<{ status: string; count: number }>;
};

export type ScanJob = {
  id: string;
  areaName: string;
  totalPoints: number;
  completed: number;
  failed: number;
  status: string;
  estimatedGoogleRequests: number | null;
  estimatedAiImages: number | null;
  estimatedCostUsd: string | number | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export async function getRatings(): Promise<Rating[]> {
  const response = await fetch(`${API_URL}/api/ratings?limit=200`, { cache: 'no-store' });
  if (!response.ok) return [];
  const data = await response.json();
  return data.items ?? [];
}

export async function getStats(): Promise<Stats> {
  const response = await fetch(`${API_URL}/api/stats`, { cache: 'no-store' });

  if (!response.ok) {
    return {
      totals: { total: 0, average_rating: null, needs_review: 0 },
      breakdown: [],
      jobs: [],
    };
  }

  return response.json();
}

export async function getJobs(): Promise<ScanJob[]> {
  const response = await fetch(`${API_URL}/api/jobs`, { cache: 'no-store' });
  if (!response.ok) return [];
  const data = await response.json();
  return data.items ?? [];
}