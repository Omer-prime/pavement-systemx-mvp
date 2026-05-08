CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE rating_status AS ENUM ('pending', 'rated', 'error', 'no_data', 'needs_review');
CREATE TYPE job_status AS ENUM ('queued', 'running', 'complete', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name TEXT NOT NULL,
  bounds JSONB,
  input_points JSONB,
  interval_meters INTEGER DEFAULT 50,
  total_points INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  status job_status DEFAULT 'queued',
  estimated_google_requests INTEGER DEFAULT 0,
  estimated_ai_images INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 4) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pavement_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_job_id UUID REFERENCES scan_jobs(id) ON DELETE SET NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'street_view_static_api_temporary',
  source_pano_id TEXT,
  image_storage_policy TEXT NOT NULL DEFAULT 'temporary_processing_only',
  stars INTEGER CHECK (stars >= 1 AND stars <= 5),
  condition_label TEXT,
  notes TEXT,
  issues TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence NUMERIC(4, 3),
  needs_human_review BOOLEAN DEFAULT FALSE,
  status rating_status DEFAULT 'pending',
  raw_ai_response JSONB,
  error_message TEXT,
  rated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pavement_ratings_location_idx ON pavement_ratings USING GIST (location);
CREATE INDEX IF NOT EXISTS pavement_ratings_scan_job_idx ON pavement_ratings(scan_job_id);
CREATE INDEX IF NOT EXISTS pavement_ratings_status_idx ON pavement_ratings(status);
CREATE INDEX IF NOT EXISTS scan_jobs_status_idx ON scan_jobs(status);
