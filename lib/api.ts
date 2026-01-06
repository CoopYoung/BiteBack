interface NutritionData {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// Mock nutrition data for MVP - in production, integrate with Nutritionix API
const MOCK_NUTRITION_DB: Record<string, NutritionData> = {
  'big mac': { calories: 550, protein: 25, carbs: 45, fat: 28 },
  'mcchicken': { calories: 400, protein: 17, carbs: 39, fat: 20 },
  'fries': { calories: 320, protein: 4, carbs: 36, fat: 17 },
  'coke': { calories: 140, protein: 0, carbs: 39, fat: 0 },
  'chicken burrito': { calories: 450, protein: 35, carbs: 40, fat: 15 },
  'rice bowl': { calories: 520, protein: 18, carbs: 65, fat: 12 },
  'salad': { calories: 250, protein: 15, carbs: 20, fat: 10 },
  'pizza': { calories: 300, protein: 12, carbs: 36, fat: 12 },
  'taco': { calories: 170, protein: 9, carbs: 14, fat: 8 },
  'sandwich': { calories: 380, protein: 20, carbs: 42, fat: 15 },
  'pasta': { calories: 450, protein: 15, carbs: 60, fat: 10 },
  'burger': { calories: 500, protein: 28, carbs: 42, fat: 22 },
  'chicken wings': { calories: 320, protein: 30, carbs: 5, fat: 18 },
  'sushi': { calories: 280, protein: 12, carbs: 35, fat: 8 },
  'coffee': { calories: 5, protein: 0, carbs: 1, fat: 0 },
};

export async function getNutritionData(itemName: string): Promise<NutritionData | null> {
  try {
    const normalizedName = itemName.toLowerCase().trim();

    // Check for exact match first
    if (MOCK_NUTRITION_DB[normalizedName]) {
      return MOCK_NUTRITION_DB[normalizedName];
    }

    // Check for partial matches
    for (const [dbItem, data] of Object.entries(MOCK_NUTRITION_DB)) {
      if (normalizedName.includes(dbItem) || dbItem.includes(normalizedName)) {
        return data;
      }
    }

    // In production, call Nutritionix API here
    // const response = await fetch(`https://api.nutritionix.com/v2/search/instant?query=${itemName}`);
    // const data = await response.json();
    // return extractNutritionData(data);

    return null;
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    return null;
  }
}

export async function batchGetNutrition(items: string[]): Promise<Map<string, NutritionData>> {
  const results = new Map<string, NutritionData>();

  for (const item of items) {
    const nutrition = await getNutritionData(item);
    if (nutrition) {
      results.set(item, nutrition);
    }
  }

  return results;
}

export function estimateCalories(itemName: string, quantity: number = 1): number {
  const nutrition = MOCK_NUTRITION_DB[itemName.toLowerCase().trim()];
  return nutrition ? nutrition.calories * quantity : 0;
}
