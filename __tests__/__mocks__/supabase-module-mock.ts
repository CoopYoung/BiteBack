/**
 * Jest module mock for @/lib/supabase
 * Import { mockSupabase } from the supabase mock to configure responses.
 */
import { mockSupabase } from './supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));
