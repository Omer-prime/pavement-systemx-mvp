export type CostEstimateInput = {
  points: number;
  headingsPerPoint: number;
  googlePer1000?: number;
  aiPerImage?: number;
};

export function estimateScanCost(input: CostEstimateInput) {
  const googlePer1000 = input.googlePer1000 ?? 7;
  const aiPerImage = input.aiPerImage ?? 0.003;
  const imageRequests = input.points * input.headingsPerPoint;
  const googleCost = (imageRequests / 1000) * googlePer1000;
  const aiCost = imageRequests * aiPerImage;

  return {
    imageRequests,
    aiImages: imageRequests,
    googleCost: Number(googleCost.toFixed(4)),
    aiCost: Number(aiCost.toFixed(4)),
    totalCost: Number((googleCost + aiCost).toFixed(4)),
  };
}
