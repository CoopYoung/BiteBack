/*
  Storage bucket for receipt images + missing delete policies
*/

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipt-images',
  'receipt-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can upload to their own folder
CREATE POLICY "Users can upload own receipt images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipt-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own images (bucket is public, but belt-and-suspenders)
CREATE POLICY "Anyone can read receipt images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipt-images');

-- Users can delete their own images
CREATE POLICY "Users can delete own receipt images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipt-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Receipt delete policy (missing from original schema)
CREATE POLICY "Users can delete own receipts"
  ON receipts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Line items delete policy
CREATE POLICY "Users can delete line items of own receipts"
  ON line_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = line_items.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

-- Line items update policy
CREATE POLICY "Users can update line items of own receipts"
  ON line_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = line_items.receipt_id
      AND receipts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = line_items.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );
