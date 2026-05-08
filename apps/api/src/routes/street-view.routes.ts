import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getExternalMode } from '../config/env.js';
import { fetchTemporaryStreetViewImage, getStreetViewMetadata } from '../services/street-view.service.js';

const streetViewQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  heading: z.coerce.number().default(0),
});

export async function streetViewRoutes(app: FastifyInstance) {
  app.get('/api/street-view/check', async (request) => {
    const query = streetViewQuerySchema.parse(request.query);
    const metadata = await getStreetViewMetadata(query.lat, query.lng, query.heading);

    return {
      mode: getExternalMode(),
      hasCoverage: metadata.status === 'OK',
      input: {
        lat: query.lat,
        lng: query.lng,
        heading: query.heading,
      },
      metadata,
      temporaryPreviewUrl:
        metadata.status === 'OK'
          ? `/api/street-view/preview?lat=${query.lat}&lng=${query.lng}&heading=${query.heading}`
          : null,
      storagePolicy: 'temporary_processing_only',
    };
  });

  app.get('/api/street-view/preview', async (request, reply) => {
    const query = streetViewQuerySchema.parse(request.query);
    const metadata = await getStreetViewMetadata(query.lat, query.lng, query.heading);

    if (metadata.status !== 'OK') {
      return reply.status(404).send({
        message: `No Street View coverage for this coordinate. Metadata status: ${metadata.status}`,
      });
    }

    const image = await fetchTemporaryStreetViewImage(query.lat, query.lng, query.heading);

    reply.header('content-type', image.contentType);
    reply.header('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    reply.header('pragma', 'no-cache');
    reply.header('expires', '0');

    return reply.send(image.buffer);
  });
}