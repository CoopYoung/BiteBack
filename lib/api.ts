import { supabase } from '@/lib/supabase';
import { Receipt, Badge, LeaderboardEntry, User } from '@/types';
import { calculateValueScore } from '@/lib/utils';

// ── Supabase Query Functions ───────────────────────────────────────

/**
 * Fetch a user's most recent receipts.
 */
export async function fetchRecentReceipts(
  userId: string,
  limit: number = 5
): Promise<Receipt[]> {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Receipt[];
  } catch (error) {
    throw new Error(
      `Failed to fetch receipts: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch leaderboard entries ranked by best value score.
 */
export async function fetchLeaderboard(
  filter: 'weekly' | 'alltime' = 'alltime',
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .order('best_value_score', { ascending: false })
      .limit(limit);

    if (filter === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('updated_at', weekAgo.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((userData, index) => ({
      rank: index + 1,
      user: userData as User,
      best_score: (userData as User).best_value_score,
      total_scans: (userData as User).total_scans,
    }));
  } catch (error) {
    throw new Error(
      `Failed to fetch leaderboard: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch all badges with earned status for a user.
 */
export async function fetchUserBadges(userId: string): Promise<Badge[]> {
  try {
    const { data: userBadges, error: badgesError } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', userId);

    if (badgesError) throw badgesError;

    const { data: allBadges, error: allBadgesError } = await supabase
      .from('badges')
      .select('*');

    if (allBadgesError) throw allBadgesError;

    const earnedIds = new Set((userBadges ?? []).map((b) => b.badge_id));
    return (allBadges ?? []).map((badge) => ({
      ...badge,
      earned: earnedIds.has(badge.id),
    })) as Badge[];
  } catch (error) {
    throw new Error(
      `Failed to fetch badges: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Save/finalize a receipt and update user stats.
 * Returns the saved receipt.
 */
export async function saveReceipt(
  receiptId: string,
  userId: string,
  params: {
    restaurantName: string;
    subtotal: number;
    total: number;
    totalCalories: number;
    currentTotalScans: number;
    currentBestScore: number;
  }
): Promise<Receipt> {
  try {
    const { restaurantName, subtotal, total, totalCalories, currentTotalScans, currentBestScore } =
      params;
    const tax = Math.max(0, total - subtotal);
    const valueScore = calculateValueScore(totalCalories, total);

    const { data, error } = await supabase
      .from('receipts')
      .update({
        restaurant_name: restaurantName.trim(),
        subtotal,
        tax,
        total,
        total_calories: totalCalories,
        calories_per_dollar: parseFloat(valueScore.toFixed(2)),
        value_score: Math.round(valueScore),
      })
      .eq('id', receiptId)
      .select()
      .single();

    if (error) throw error;

    // Update user stats
    const newTotalScans = currentTotalScans + 1;
    const newBestScore = Math.max(currentBestScore, valueScore);
    const { error: userError } = await supabase
      .from('users')
      .update({
        total_scans: newTotalScans,
        best_value_score: newBestScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      throw new Error(`Failed to update user stats: ${userError.message}`);
    }

    return data as Receipt;
  } catch (error) {
    throw new Error(
      `Failed to save receipt: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ── Nutrition Functions ────────────────────────────────────────────

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
