export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : fallback;
}

export function calcTotalOffer(verifiedWeight: number, pricePerKg: number): number {
  return round2(verifiedWeight * pricePerKg);
}

export function calcRecovery(outputWeight: number, inputWeight: number): number {
  return round2(safeDivide(outputWeight, inputWeight) * 100);
}

export function calcLoss(inputWeight: number, outputWeight: number): number {
  return round2(Math.max(0, inputWeight - outputWeight));
}
