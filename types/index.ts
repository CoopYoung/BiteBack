export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  total_scans: number;
  best_value_score: number;
  leaderboard_rank?: number;
  is_premium: boolean;
  created_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  restaurant_name: string;
  location_city?: string;
  location_lat?: number;
  location_lng?: number;
  subtotal: number;
  tax: number;
  total: number;
  total_calories: number;
  calories_per_dollar: number;
  value_score: number;
  image_url?: string;
  raw_ocr_text?: string;
  created_at: string;
  line_items?: LineItem[];
}

export interface LineItem {
  id: string;
  receipt_id: string;
  item_name: string;
  price: number;
  quantity: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  nutrition_api_id?: string;
  matched_confidence?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  category: string;
  earned?: boolean;
  earned_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  receipt_id?: string;
  caption?: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: User;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  best_score: number;
  total_scans: number;
}
