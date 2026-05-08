import type { FastifyInstance } from 'fastify';
import { assertDbConnection } from '../db/pool.js';
import { redisConnection } from '../services/queue.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const db = await assertDbConnection();
    const redis = await redisConnection.ping();
    return {
      ok: true,
      service: 'systemx-pavement-api',
      db,
      redis,
    };
  });
}
