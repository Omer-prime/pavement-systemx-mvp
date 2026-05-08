# SystemX Pavement Rating MVP

AI-assisted pavement rating system with a stronger backend foundation for a fast client MVP.

## What this MVP includes

- Fastify + TypeScript backend API
- PostgreSQL + PostGIS geospatial database
- Redis + BullMQ queue for scan jobs
- Street View metadata check before image requests
- Temporary Street View image processing only
- AI rating service with mock mode first and Claude Vision integration ready
- Ratings table with confidence score and human-review flag
- Cost estimate endpoint before scans
- Next.js dashboard with stats, scan button, ratings list, and MVP map placeholder

## Why Street View images are not permanently stored

For safety and compliance, the MVP stores rating results, coordinates, heading, source panorama ID, confidence, and notes. Street View images are processed temporarily only. If the client later uses their own captured images, S3 storage can be enabled for those client-owned images.

## Local setup

### 1. Install pnpm

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

### 2. Create environment file

```bash
cp .env.example .env
```

Keep `MOCK_EXTERNAL_APIS=true` for the first local run.

### 3. Start database and Redis

```bash
docker compose up -d postgres redis
```

### 4. Install packages

```bash
pnpm install
```

### 5. Start API

```bash
pnpm dev:api
```

### 6. Start worker in a second terminal

```bash
pnpm --filter @systemx/api worker
```

### 7. Start frontend in a third terminal

```bash
pnpm dev:web
```

Open:

```text
http://localhost:3000
```

API health:

```text
http://localhost:4000/health
```

## Useful API calls

### Estimate a scan

```bash
curl -X POST http://localhost:4000/api/jobs/estimate ^
  -H "Content-Type: application/json" ^
  -d "{\"areaName\":\"MVP Test\",\"points\":[{\"lat\":51.5074,\"lng\":-0.1278}],\"headings\":[0]}"
```

### Start a scan

```bash
curl -X POST http://localhost:4000/api/jobs/scan ^
  -H "Content-Type: application/json" ^
  -d "{\"areaName\":\"MVP Test\",\"confirmCost\":true,\"points\":[{\"lat\":51.5074,\"lng\":-0.1278}],\"headings\":[0]}"
```

### Get ratings

```bash
curl http://localhost:4000/api/ratings
```

### Get stats

```bash
curl http://localhost:4000/api/stats
```

## Moving from mock mode to real APIs

Update `.env`:

```env
MOCK_EXTERNAL_APIS=false
GOOGLE_STREET_VIEW_API_KEY=client_google_key
ANTHROPIC_API_KEY=client_anthropic_key
```

Then restart API and worker.

## Production upgrade path

- Replace the MVP map placeholder with Google Maps markers
- Add authentication and roles
- Add admin job management screen
- Add manual review/correction flow
- Add CSV/GeoJSON export
- Add S3 storage only for client-owned uploaded/captured images
- Add deployment Dockerfile and CI/CD
