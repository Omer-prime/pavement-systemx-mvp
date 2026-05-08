import type { FastifyInstance } from 'fastify';
import { pool } from '../db/pool.js';

export async function statsRoutes(app: FastifyInstance) {
  app.get('/api/stats', async () => {
    const totals = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        ROUND(AVG(stars)::numeric, 2) AS average_rating,
        COUNT(*) FILTER (WHERE needs_human_review = true)::int AS needs_review
      FROM pavement_ratings
      WHERE status IN ('rated', 'needs_review')
    `);

    const breakdown = await pool.query(`
      SELECT condition_label AS condition, COUNT(*)::int AS count
      FROM pavement_ratings
      WHERE status IN ('rated', 'needs_review')
      GROUP BY condition_label
      ORDER BY count DESC
    `);

    const jobs = await pool.query(`
      SELECT status, COUNT(*)::int AS count
      FROM scan_jobs
      GROUP BY status
    `);

    return {
      totals: totals.rows[0],
      breakdown: breakdown.rows,
      jobs: jobs.rows,
    };
  });
}
