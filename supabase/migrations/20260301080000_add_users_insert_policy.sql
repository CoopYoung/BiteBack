-- Allow authenticated users to insert their own profile row (needed for signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own line items
CREATE POLICY "Users can insert line items for own receipts"
  ON line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = line_items.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );
