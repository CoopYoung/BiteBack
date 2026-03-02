import { COLORS, THEME } from '@/constants/colors';

describe('COLORS', () => {
  it('has required color keys', () => {
    expect(COLORS.primary).toBeDefined();
    expect(COLORS.dark).toBeDefined();
    expect(COLORS.white).toBeDefined();
    expect(COLORS.excellent).toBeDefined();
    expect(COLORS.good).toBeDefined();
    expect(COLORS.poor).toBeDefined();
    expect(COLORS.danger).toBeDefined();
  });

  it('uses valid hex color format', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const [key, value] of Object.entries(COLORS)) {
      expect(value).toMatch(hexRegex);
    }
  });
});

describe('THEME', () => {
  it('has spacing scale', () => {
    expect(THEME.spacing.xs).toBeLessThan(THEME.spacing.sm);
    expect(THEME.spacing.sm).toBeLessThan(THEME.spacing.md);
    expect(THEME.spacing.md).toBeLessThan(THEME.spacing.lg);
    expect(THEME.spacing.lg).toBeLessThan(THEME.spacing.xl);
  });

  it('has font scale', () => {
    expect(THEME.fonts.xs).toBeLessThan(THEME.fonts.base);
    expect(THEME.fonts.base).toBeLessThan(THEME.fonts.lg);
    expect(THEME.fonts.lg).toBeLessThan(THEME.fonts.xl);
  });

  it('has border radius values', () => {
    expect(THEME.borderRadius.sm).toBeLessThan(THEME.borderRadius.full);
  });
});
