import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { scanQueue } from '../services/queue.js';
import { estimateScanCost } from '../utils/cost.js';
import { generateGridPoints } from '../utils/geo.js';
import { env } from '../config/env.js';

const scanRequestSchema = z.object({
  areaName: z.string().min(2).default('MVP Test Area'),
  points: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
  bounds: z
    .object({
      north: z.number(),
      south: z.number(),
      east: z.number(),
      west: z.number(),
    })
    .optional(),
  intervalMeters: z.number().int().min(10).max(500).default(env.DEFAULT_SCAN_INTERVAL_METERS),
  headings: z.array(z.number().int()).default([0]),
  confirmCost: z.boolean().default(false),
});

export async function jobRoutes(app: FastifyInstance) {
  app.get('/api/jobs', async () => {
    const result = await pool.query(`
      SELECT id, area_name AS "areaName", total_points AS "totalPoints", completed, failed, status,
        estimated_google_requests AS "estimatedGoogleRequests",
        estimated_ai_images AS "estimatedAiImages",
        estimated_cost_usd AS "estimatedCostUsd",
        error_message AS "errorMessage",
        created_at AS "createdAt", started_at AS "startedAt", completed_at AS "completedAt"
      FROM scan_jobs
      ORDER BY created_at DESC
      LIMIT 50
    `);

    return { items: result.rows };
  });

  app.get('/api/jobs/:id', async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const result = await pool.query(
      `
      SELECT id, area_name AS "areaName", bounds, input_points AS "inputPoints", interval_meters AS "intervalMeters",
        total_points AS "totalPoints", completed, failed, status,
        estimated_google_requests AS "estimatedGoogleRequests",
        estimated_ai_images AS "estimatedAiImages",
        estimated_cost_usd AS "estimatedCostUsd",
        error_message AS "errorMessage",
        created_at AS "createdAt", started_at AS "startedAt", completed_at AS "completedAt"
      FROM scan_jobs
      WHERE id = $1
      `,
      [params.id],
    );

    if (!result.rows[0]) throw httpError(404, 'Job not found');
    return result.rows[0];
  });

  app.post('/api/jobs/estimate', async (request) => {
    const body = scanRequestSchema.parse(request.body);
    const points = resolvePoints(body);
    const estimate = estimateScanCost({ points: points.length, headingsPerPoint: body.headings.length });

    return {
      points: points.length,
      headingsPerPoint: body.headings.length,
      maxAllowedPoints: env.MAX_POINTS_PER_JOB,
      withinMvpLimit: points.length <= env.MAX_POINTS_PER_JOB,
      ...estimate,
    };
  });

  app.post('/api/jobs/scan', async (request) => {
    const body = scanRequestSchema.parse(request.body);
    const points = resolvePoints(body);

    if (points.length > env.MAX_POINTS_PER_JOB) {
      throw httpError(
  400,
  `Too many points for MVP. Limit is ${env.MAX_POINTS_PER_JOB}. Use /api/jobs/estimate first and reduce scan area.`,
);
    }

    const estimate = estimateScanCost({ points: points.length, headingsPerPoint: body.headings.length });

    if (!body.confirmCost && estimate.totalCost > 1) {
    throw httpError(
  400,
  `Cost confirmation required before starting scan. Estimated cost: $${estimate.totalCost}. Send confirmCost: true if approved.`,
);
    }

    const insert = await pool.query(
      `
      INSERT INTO scan_jobs (
        area_name, bounds, input_points, interval_meters, total_points,
        estimated_google_requests, estimated_ai_images, estimated_cost_usd, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'queued')
      RETURNING id
      `,
      [
  body.areaName,
  body.bounds ? JSON.stringify(body.bounds) : null,
  JSON.stringify(points),
  body.intervalMeters,
  points.length,
  estimate.imageRequests,
  estimate.aiImages,
  estimate.totalCost,
],
    );

    const jobId = insert.rows[0].id as string;
    await scanQueue.add('scan-area', { jobId, points, headings: body.headings });

    return {
      jobId,
      status: 'queued',
      points: points.length,
      headings: body.headings,
      estimate,
    };
  });
}

function resolvePoints(body: z.infer<typeof scanRequestSchema>) {
  if (body.points?.length) return body.points;
  if (body.bounds) return generateGridPoints(body.bounds, body.intervalMeters, env.MAX_POINTS_PER_JOB + 1);
  throw new Error('Provide either points[] or bounds');
}
function httpError(statusCode: number, message: string) {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}