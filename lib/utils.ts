export function calculateValueScore(calories: number, totalSpent: number): number {
  if (totalSpent <= 0) return 0;
  return calories / totalSpent;
}

export function getValueCategory(caloriesPerDollar: number): 'excellent' | 'good' | 'poor' {
  if (caloriesPerDollar >= 150) return 'excellent';
  if (caloriesPerDollar >= 50) return 'good';
  return 'poor';
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calculateMacroPercentages(
  protein: number,
  carbs: number,
  fat: number
): { protein: number; carbs: number; fat: number } {
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const total = proteinCals + carbsCals + fatCals;

  if (total === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: Math.round((proteinCals / total) * 100),
    carbs: Math.round((carbsCals / total) * 100),
    fat: Math.round((fatCals / total) * 100),
  };
}

export function fuzzyMatch(input: string, target: string): number {
  const inputLower = input.toLowerCase();
  const targetLower = target.toLowerCase();

  if (inputLower === targetLower) return 1;
  if (targetLower.includes(inputLower)) return 0.8;
  if (inputLower.includes(targetLower)) return 0.6;

  let matches = 0;
  for (const char of inputLower) {
    if (targetLower.includes(char)) matches++;
  }

  return matches / Math.max(inputLower.length, targetLower.length);
}
