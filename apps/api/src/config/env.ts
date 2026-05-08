import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env'), override: true });

const schema = z.object({
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_STREET_VIEW_API_KEY: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),

  MOCK_EXTERNAL_APIS: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),

  MAX_POINTS_PER_JOB: z.coerce.number().default(50),
  DEFAULT_SCAN_INTERVAL_METERS: z.coerce.number().default(50),

  STREET_VIEW_RADIUS_METERS: z.coerce.number().default(50),
  STREET_VIEW_IMAGE_SIZE: z.string().default('640x480'),
});

export const env = schema.parse(process.env);

export function getExternalMode() {
  return env.MOCK_EXTERNAL_APIS ? 'mock' : 'live_google';
}