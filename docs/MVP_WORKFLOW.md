# MVP Workflow

## Step 1 — Client selects area or demo points

For the few-day MVP, use a small controlled list of 10-20 coordinates first. This avoids unexpected Google API usage and keeps the demo stable.

## Step 2 — Backend estimates cost

The backend estimates image requests based on:

- number of coordinates
- number of headings per coordinate
- Google Street View image cost estimate
- AI image rating cost estimate

Large scans should require explicit confirmation.

## Step 3 — Scan job is queued

The API writes a `scan_jobs` row and pushes a job to Redis/BullMQ. This keeps the API fast and prevents the frontend from waiting while images are processed.

## Step 4 — Worker checks Street View metadata

Before any image request, the worker calls metadata. If there is no coverage, it stores a `no_data` rating instead of wasting AI tokens.

## Step 5 — Image is processed temporarily

The worker fetches a Street View image and passes it directly to the AI rating service. It does not permanently store or rehost the Street View image.

## Step 6 — AI returns rating

The AI returns:

- stars from 1 to 5
- condition label
- notes
- issues array
- confidence score
- human review flag

## Step 7 — Rating is stored in PostGIS

The database stores geospatial rating data using `GEOGRAPHY(Point, 4326)`, which allows fast nearby, bbox, and GIS-style queries.

## Step 8 — Frontend displays result

The dashboard displays:

- total ratings
- average rating
- review count
- map markers
- latest rating list

## Step 9 — Human review improves trust

Low confidence or poor-condition ratings are flagged for human review. This protects the client from fully relying on AI for safety-related decisions.
