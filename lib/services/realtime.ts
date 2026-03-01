import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type ChangeHandler<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
}) => void;

/**
 * Subscribe to realtime changes on a table, scoped to a specific user.
 * Returns an unsubscribe function.
 */
export function subscribeToUserTable<T extends Record<string, unknown>>(
  table: string,
  userId: string,
  onchange: ChangeHandler<T>
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`${table}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onchange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as Partial<T>,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to leaderboard changes (all users, top scores).
 */
export function subscribeToLeaderboard(
  onchange: ChangeHandler<Record<string, unknown>>
): () => void {
  const channel = supabase
    .channel('leaderboard')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
      },
      (payload) => {
        onchange({
          eventType: 'UPDATE',
          new: payload.new as Record<string, unknown>,
          old: payload.old as Record<string, unknown>,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to badge awards for a user.
 */
export function subscribeToBadges(
  userId: string,
  onBadgeEarned: (badgeId: string) => void
): () => void {
  const channel = supabase
    .channel(`badges:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_badges',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onBadgeEarned(payload.new.badge_id as string);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
