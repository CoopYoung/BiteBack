import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const RECEIPT_BUCKET = 'receipt-images';

/**
 * Upload a receipt image to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadReceiptImage(
  userId: string,
  localUri: string
): Promise<string> {
  const timestamp = Date.now();
  const ext = localUri.split('.').pop() || 'jpg';
  const filePath = `${userId}/${timestamp}.${ext}`;

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(filePath, decode(base64), {
      contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      upsert: false,
    });

  if (error) throw new Error(`Failed to upload image: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(RECEIPT_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Delete a receipt image from storage.
 */
export async function deleteReceiptImage(imageUrl: string): Promise<void> {
  // Extract path from full URL
  const bucketPrefix = `${RECEIPT_BUCKET}/`;
  const pathIndex = imageUrl.indexOf(bucketPrefix);
  if (pathIndex === -1) return;

  const filePath = imageUrl.substring(pathIndex + bucketPrefix.length);

  const { error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .remove([filePath]);

  if (error) console.warn('Failed to delete image:', error.message);
}
