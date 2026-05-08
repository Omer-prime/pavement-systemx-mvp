import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export async function assertDbConnection() {
  const result = await pool.query('SELECT NOW() as now');
  return result.rows[0];
}
