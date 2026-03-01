import {
  getNutritionData,
  batchGetNutrition,
  estimateCalories,
} from '@/lib/api';

describe('getNutritionData', () => {
  it('returns exact match from mock DB', async () => {
    const result = await getNutritionData('big mac');
    expect(result).not.toBeNull();
    expect(result!.calories).toBe(550);
    expect(result!.protein).toBe(25);
  });

  it('is case insensitive', async () => {
    const result = await getNutritionData('Big Mac');
    expect(result).not.toBeNull();
    expect(result!.calories).toBe(550);
  });

  it('handles partial matches', async () => {
    const result = await getNutritionData('large fries');
    expect(result).not.toBeNull();
    expect(result!.calories).toBe(320);
  });

  it('returns null for unknown items', async () => {
    const result = await getNutritionData('dragon fruit soufflé');
    expect(result).toBeNull();
  });

  it('trims whitespace', async () => {
    const result = await getNutritionData('  pizza  ');
    expect(result).not.toBeNull();
  });
});

describe('batchGetNutrition', () => {
  it('returns a map of found items', async () => {
    const results = await batchGetNutrition(['pizza', 'burger', 'nonexistent']);
    expect(results.size).toBe(2);
    expect(results.has('pizza')).toBe(true);
    expect(results.has('burger')).toBe(true);
    expect(results.has('nonexistent')).toBe(false);
  });

  it('handles empty array', async () => {
    const results = await batchGetNutrition([]);
    expect(results.size).toBe(0);
  });
});

describe('estimateCalories', () => {
  it('returns calories for known item', () => {
    expect(estimateCalories('pizza')).toBe(300);
  });

  it('multiplies by quantity', () => {
    expect(estimateCalories('pizza', 3)).toBe(900);
  });

  it('returns 0 for unknown item', () => {
    expect(estimateCalories('unicorn steak')).toBe(0);
  });
});
