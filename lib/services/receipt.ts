import { supabase } from '@/lib/supabase';
import { getNutritionData, batchGetNutrition } from '@/lib/api';
import { Receipt, LineItem } from '@/types';
import { calculateValueScore } from '@/lib/utils';

interface ParsedLineItem {
  item_name: string;
  price: number;
  quantity: number;
}

interface ProcessedReceipt {
  receipt: Receipt;
  lineItems: LineItem[];
}

/**
 * Create a draft receipt from a scanned image.
 * Returns the receipt ID for the results/edit screen.
 */
export async function createDraftReceipt(
  userId: string,
  imageUri: string,
  ocrText?: string
): Promise<string> {
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      user_id: userId,
      restaurant_name: 'New Receipt',
      subtotal: 0,
      tax: 0,
      total: 0,
      total_calories: 0,
      calories_per_dollar: 0,
      value_score: 0,
      image_url: imageUri,
      raw_ocr_text: ocrText || '',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create receipt: ${error.message}`);
  return data.id;
}

/**
 * Finalize a receipt with user-entered or OCR-parsed data.
 * Value score calculated here; stats update handled by DB trigger.
 */
export async function finalizeReceipt(
  receiptId: string,
  params: {
    restaurantName: string;
    subtotal: number;
    total: number;
    totalCalories: number;
    locationCity?: string;
  }
): Promise<Receipt> {
  const { restaurantName, subtotal, total, totalCalories, locationCity } = params;
  const tax = Math.max(0, total - subtotal);
  const caloriesPerDollar = calculateValueScore(totalCalories, total);

  const { data, error } = await supabase
    .from('receipts')
    .update({
      restaurant_name: restaurantName.trim(),
      subtotal,
      tax,
      total,
      total_calories: totalCalories,
      calories_per_dollar: parseFloat(caloriesPerDollar.toFixed(2)),
      value_score: Math.round(caloriesPerDollar),
      location_city: locationCity || null,
    })
    .eq('id', receiptId)
    .select()
    .single();

  if (error) throw new Error(`Failed to finalize receipt: ${error.message}`);
  return data as Receipt;
}

/**
 * Add line items to a receipt with automatic nutrition lookup.
 */
export async function addLineItems(
  receiptId: string,
  items: ParsedLineItem[]
): Promise<LineItem[]> {
  const itemNames = items.map((i) => i.item_name);
  const nutritionMap = await batchGetNutrition(itemNames);

  const lineItemRows = items.map((item) => {
    const nutrition = nutritionMap.get(item.item_name);
    return {
      receipt_id: receiptId,
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity,
      calories: nutrition ? nutrition.calories * item.quantity : null,
      protein_g: nutrition?.protein ?? null,
      carbs_g: nutrition?.carbs ?? null,
      fat_g: nutrition?.fat ?? null,
      matched_confidence: nutrition ? 0.7 : null,
    };
  });

  const { data, error } = await supabase
    .from('line_items')
    .insert(lineItemRows)
    .select();

  if (error) throw new Error(`Failed to add line items: ${error.message}`);
  return (data || []) as LineItem[];
}

/**
 * Get a full receipt with its line items.
 */
export async function getReceiptWithItems(receiptId: string): Promise<ProcessedReceipt | null> {
  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', receiptId)
    .single();

  if (receiptError || !receipt) return null;

  const { data: lineItems } = await supabase
    .from('line_items')
    .select('*')
    .eq('receipt_id', receiptId)
    .order('created_at', { ascending: true });

  return {
    receipt: receipt as Receipt,
    lineItems: (lineItems || []) as LineItem[],
  };
}

/**
 * Delete a receipt (line items cascade via DB foreign key).
 */
export async function deleteReceipt(receiptId: string): Promise<void> {
  const { error } = await supabase.from('receipts').delete().eq('id', receiptId);
  if (error) throw new Error(`Failed to delete receipt: ${error.message}`);
}

/**
 * Get user's receipt history with pagination.
 */
export async function getUserReceipts(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Receipt[]> {
  const { limit = 20, offset = 0 } = options;

  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch receipts: ${error.message}`);
  return (data || []) as Receipt[];
}
