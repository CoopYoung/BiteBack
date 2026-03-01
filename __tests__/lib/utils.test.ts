import {
  calculateValueScore,
  getValueCategory,
  formatCurrency,
  formatDate,
  calculateMacroPercentages,
  fuzzyMatch,
} from '@/lib/utils';

describe('calculateValueScore', () => {
  it('returns calories / dollar', () => {
    expect(calculateValueScore(1000, 10)).toBe(100);
  });

  it('returns 0 when totalSpent is 0', () => {
    expect(calculateValueScore(500, 0)).toBe(0);
  });

  it('returns 0 when totalSpent is negative', () => {
    expect(calculateValueScore(500, -5)).toBe(0);
  });

  it('handles decimal values', () => {
    expect(calculateValueScore(750, 5)).toBeCloseTo(150);
  });
});

describe('getValueCategory', () => {
  it('returns excellent for >= 150', () => {
    expect(getValueCategory(150)).toBe('excellent');
    expect(getValueCategory(300)).toBe('excellent');
  });

  it('returns good for 50-149', () => {
    expect(getValueCategory(50)).toBe('good');
    expect(getValueCategory(149)).toBe('good');
  });

  it('returns poor for < 50', () => {
    expect(getValueCategory(0)).toBe('poor');
    expect(getValueCategory(49)).toBe('poor');
  });
});

describe('formatCurrency', () => {
  it('formats with $ and 2 decimal places', () => {
    expect(formatCurrency(10)).toBe('$10.00');
    expect(formatCurrency(9.5)).toBe('$9.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatDate', () => {
  it('formats date string to readable format', () => {
    const result = formatDate('2026-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

describe('calculateMacroPercentages', () => {
  it('calculates percentage of calories from each macro', () => {
    // 25g protein = 100 cal, 50g carbs = 200 cal, 11g fat = 99 cal ≈ 399 total
    const result = calculateMacroPercentages(25, 50, 11);
    expect(result.protein + result.carbs + result.fat).toBeGreaterThanOrEqual(99);
    expect(result.protein).toBeGreaterThan(0);
    expect(result.carbs).toBeGreaterThan(result.protein); // carbs dominate
  });

  it('returns all zeros for no macros', () => {
    expect(calculateMacroPercentages(0, 0, 0)).toEqual({
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});

describe('fuzzyMatch', () => {
  it('returns 1 for exact match', () => {
    expect(fuzzyMatch('burger', 'burger')).toBe(1);
  });

  it('is case insensitive', () => {
    expect(fuzzyMatch('Burger', 'burger')).toBe(1);
  });

  it('returns 0.8 when target contains input', () => {
    expect(fuzzyMatch('burg', 'cheeseburger')).toBe(0.8);
  });

  it('returns 0.6 when input contains target', () => {
    expect(fuzzyMatch('big mac combo', 'big mac')).toBe(0.6);
  });

  it('returns partial score for partial character overlap', () => {
    const score = fuzzyMatch('pizza', 'pasta');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.6);
  });
});
