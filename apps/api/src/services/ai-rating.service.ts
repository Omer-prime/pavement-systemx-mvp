import { env } from '../config/env.js';

export type AiRatingResult = {
  stars: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  notes: string;
  issues: string[];
  confidence: number;
  needsHumanReview: boolean;
  raw?: unknown;
};

export async function ratePavementImage(imageBuffer: Buffer): Promise<AiRatingResult> {
  if (env.MOCK_EXTERNAL_APIS) {
    const pseudoScore = (imageBuffer.length % 5) + 1;
    return normalizeRating({
      stars: pseudoScore,
      condition: conditionFromStars(pseudoScore),
      notes: 'Mock AI rating for development. Replace with live Claude/GPT Vision call after API keys are added.',
      issues: pseudoScore <= 2 ? ['visible surface damage', 'requires review'] : ['minor wear'],
      confidence: pseudoScore <= 2 ? 0.68 : 0.82,
      needsHumanReview: pseudoScore <= 2,
    });
  }

  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is missing');
  }

  const base64Image = imageBuffer.toString('base64');
  const prompt = `You are a professional pavement quality inspector. Analyze the pavement/sidewalk visible in this image. Rate quality from 1 to 5 stars. Consider cracks, smoothness, accessibility, curb cuts, debris, water damage, trip hazards and uneven slabs. Return ONLY valid JSON with keys: stars, condition, notes, issues, confidence, needsHumanReview.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI rating request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data?.content?.find((item: { type: string }) => item.type === 'text')?.text;
  if (!text) throw new Error('AI response did not include text JSON');

  const parsed = JSON.parse(text);
  return normalizeRating({ ...parsed, raw: data });
}

function normalizeRating(input: Partial<AiRatingResult>): AiRatingResult {
  const stars = Math.max(1, Math.min(5, Number(input.stars ?? 3)));
  const confidence = Math.max(0, Math.min(1, Number(input.confidence ?? 0.5)));
  return {
    stars,
    condition: input.condition ?? conditionFromStars(stars),
    notes: String(input.notes ?? 'No notes returned.'),
    issues: Array.isArray(input.issues) ? input.issues.map(String) : [],
    confidence,
    needsHumanReview: Boolean(input.needsHumanReview ?? (confidence < 0.7 || stars <= 2)),
    raw: input.raw ?? input,
  };
}

function conditionFromStars(stars: number): AiRatingResult['condition'] {
  if (stars >= 5) return 'Excellent';
  if (stars >= 4) return 'Good';
  if (stars >= 3) return 'Fair';
  if (stars >= 2) return 'Poor';
  return 'Critical';
}
