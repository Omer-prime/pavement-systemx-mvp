import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const listQuerySchema = z.object({
  bbox: z.string().optional(),
  stars: z.coerce.number().int().min(1).max(5).optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});

export async function ratingRoutes(app: FastifyInstance) {
  app.get('/api/ratings', async (request) => {
    const query = listQuerySchema.parse(request.query);
    const values: unknown[] = [];
    const where: string[] = [];

    if (query.stars) {
      values.push(query.stars);
      where.push(`stars = $${values.length}`);
    }

    if (query.status) {
      values.push(query.status);
      where.push(`status = $${values.length}`);
    }

    if (query.bbox) {
      const [west, south, east, north] = query.bbox.split(',').map(Number);
      if ([west, south, east, north].some(Number.isNaN)) {
        throw Object.assign(new Error('bbox must be west,south,east,north'), { statusCode: 400 });
      }
      values.push(west, south, east, north);
      where.push(`ST_Intersects(location::geometry, ST_MakeEnvelope($${values.length - 3}, $${values.length - 2}, $${values.length - 1}, $${values.length}, 4326))`);
    }

    values.push(query.limit);
    const sql = `
      SELECT
        id,
        scan_job_id AS "scanJobId",
        lat,
        lng,
        heading,
        source,
        source_pano_id AS "sourcePanoId",
        image_storage_policy AS "imageStoragePolicy",
        stars,
        condition_label AS "condition",
        notes,
        issues,
        confidence,
        needs_human_review AS "needsHumanReview",
        status,
        rated_at AS "ratedAt",
        created_at AS "createdAt"
      FROM pavement_ratings
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC
      LIMIT $${values.length}
    `;

    const result = await pool.query(sql, values);
    return { items: result.rows };
  });

  app.get('/api/ratings/nearby', async (request) => {
    const schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radiusMeters: z.coerce.number().default(250),
      limit: z.coerce.number().default(100),
    });
    const query = schema.parse(request.query);

    const result = await pool.query(
      `
      SELECT id, lat, lng, heading, stars, condition_label AS "condition", notes, issues, confidence,
        ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters
      FROM pavement_ratings
      WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
      ORDER BY distance_meters ASC
      LIMIT $4
      `,
      [query.lat, query.lng, query.radiusMeters, query.limit],
    );

    return { items: result.rows };
  });
}
