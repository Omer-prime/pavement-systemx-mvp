import 'dotenv/config';
import { Worker } from 'bullmq';
import { pool } from '../db/pool.js';
import { redisConnection } from '../services/queue.js';
import { fetchTemporaryStreetViewImage, getStreetViewMetadata } from '../services/street-view.service.js';
import { ratePavementImage } from '../services/ai-rating.service.js';

type ScanJobData = {
  jobId: string;
  points: Array<{ lat: number; lng: number }>;
  headings: number[];
};

async function processScan(data: ScanJobData) {
  await pool.query(`UPDATE scan_jobs SET status = 'running', started_at = NOW() WHERE id = $1`, [data.jobId]);

  for (const point of data.points) {
    for (const heading of data.headings) {
      try {
       const metadata = await getStreetViewMetadata(point.lat, point.lng, heading);

        if (metadata.status !== 'OK') {
          await insertRating({
            scanJobId: data.jobId,
            lat: point.lat,
            lng: point.lng,
            heading,
            status: 'no_data',
            sourcePanoId: metadata.pano_id ?? null,
            errorMessage: `Street View metadata status: ${metadata.status}`,
          });
          await incrementJob(data.jobId, false);
          continue;
        }

        const image = await fetchTemporaryStreetViewImage(point.lat, point.lng, heading);
        const rating = await ratePavementImage(image.buffer);
        await insertRating({
          scanJobId: data.jobId,
          lat: point.lat,
          lng: point.lng,
          heading,
          sourcePanoId: metadata.pano_id ?? null,
          status: rating.needsHumanReview ? 'needs_review' : 'rated',
          stars: rating.stars,
          condition: rating.condition,
          notes: rating.notes,
          issues: rating.issues,
          confidence: rating.confidence,
          needsHumanReview: rating.needsHumanReview,
          rawAiResponse: rating.raw ?? rating,
        });

        await incrementJob(data.jobId, false);
      } catch (error) {
        await insertRating({
          scanJobId: data.jobId,
          lat: point.lat,
          lng: point.lng,
          heading,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        await incrementJob(data.jobId, true);
      }
    }
  }

  await pool.query(`UPDATE scan_jobs SET status = 'complete', completed_at = NOW() WHERE id = $1`, [data.jobId]);
}

async function insertRating(input: {
  scanJobId: string;
  lat: number;
  lng: number;
  heading: number;
  status: 'pending' | 'rated' | 'error' | 'no_data' | 'needs_review';
  sourcePanoId?: string | null;
  stars?: number;
  condition?: string;
  notes?: string;
  issues?: string[];
  confidence?: number;
  needsHumanReview?: boolean;
  rawAiResponse?: unknown;
  errorMessage?: string;
}) {
  await pool.query(
    `
    INSERT INTO pavement_ratings (
      scan_job_id, location, lat, lng, heading, source_pano_id,
      stars, condition_label, notes, issues, confidence, needs_human_review,
      status, raw_ai_response, error_message, rated_at
    )
    VALUES (
  $1,
  ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9::text[],
  $10,
  $11,
  $12::rating_status,
  $13::jsonb,
  $14,
  CASE
    WHEN $12::rating_status IN ('rated'::rating_status, 'needs_review'::rating_status)
    THEN NOW()
    ELSE NULL
  END
)
    `,
    [
      input.scanJobId,
      input.lat,
      input.lng,
      input.heading,
      input.sourcePanoId ?? null,
      input.stars ?? null,
      input.condition ?? null,
      input.notes ?? null,
      input.issues ?? [],
      input.confidence ?? null,
      input.needsHumanReview ?? false,
      input.status,
      input.rawAiResponse ? JSON.stringify(input.rawAiResponse) : null,
      input.errorMessage ?? null,
    ],
  );
}

async function incrementJob(jobId: string, failed: boolean) {
  await pool.query(
    `UPDATE scan_jobs SET completed = completed + 1, failed = failed + $2 WHERE id = $1`,
    [jobId, failed ? 1 : 0],
  );
}

const worker = new Worker<ScanJobData>('scan-jobs', async (job) => processScan(job.data), {
  connection: redisConnection,
  concurrency: 2,
});

worker.on('completed', (job) => console.log(`Scan job completed: ${job.id}`));
worker.on('failed', async (job, error) => {
  console.error(`Scan job failed: ${job?.id}`, error);
  const jobId = job?.data?.jobId;
  if (jobId) {
    await pool.query(`UPDATE scan_jobs SET status = 'failed', error_message = $2, completed_at = NOW() WHERE id = $1`, [jobId, error.message]);
  }
});

console.log('SystemX scan worker is running...');
