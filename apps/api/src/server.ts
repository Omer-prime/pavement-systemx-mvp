import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from './config/env.js';
import { healthRoutes } from './routes/health.routes.js';
import { ratingRoutes } from './routes/ratings.routes.js';
import { jobRoutes } from './routes/jobs.routes.js';
import { statsRoutes } from './routes/stats.routes.js';
import { streetViewRoutes } from './routes/street-view.routes.js';

const app = Fastify({ logger: true });

await app.register(helmet);
await app.register(cors, {
  origin: true,
});

await app.register(healthRoutes);
await app.register(ratingRoutes);
await app.register(jobRoutes);
await app.register(statsRoutes);
await app.register(streetViewRoutes);

app.setErrorHandler((error: FastifyError, _request, reply) => {
  const statusCode = error.statusCode ?? 500;
  app.log.error(error);
  reply.status(statusCode).send({
    error: error.name,
    message: error.message,
    statusCode,
  });
});

try {
  await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  app.log.info(`SystemX API running on port ${env.API_PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
