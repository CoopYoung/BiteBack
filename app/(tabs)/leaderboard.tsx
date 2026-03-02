import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { fetchLeaderboard } from '@/lib/api';
import { LeaderboardEntry } from '@/types';
import { COLORS, THEME } from '@/constants/colors';
import { Trophy, Medal } from 'lucide-react-native';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'weekly' | 'alltime'>('alltime');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard(filter);
      setEntries(data);
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} color={COLORS.good} />;
    if (rank === 2) return <Medal size={20} color={COLORS.gray400} />;
    if (rank === 3) return <Medal size={20} color={COLORS.warning} />;
    return null;
  };

  const renderEntry = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <View
        style={[
          styles.entry,
          user?.id === item.user.id && styles.entryHighlight,
        ]}
      >
        <View style={styles.rankContainer}>
          {getRankIcon(item.rank) || (
            <Text style={styles.rankNumber}>{item.rank}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.user.display_name}</Text>
          <Text style={styles.stat}>
            {item.total_scans} scans
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{item.best_score.toFixed(0)}</Text>
          <Text style={styles.scoreLabel}>cals/$</Text>
        </View>
      </View>
    ),
    [user?.id]
  );

  const keyExtractor = useCallback(
    (item: LeaderboardEntry) => item.user.id,
    []
  );

  const renderEmpty = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />;
    }
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={loadLeaderboard} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No leaderboard data yet</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'weekly' && styles.filterActive]}
            onPress={() => setFilter('weekly')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'weekly' && styles.filterTextActive,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'alltime' && styles.filterActive]}
            onPress={() => setFilter('alltime')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'alltime' && styles.filterTextActive,
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray800,
  },
  title: {
    fontSize: THEME.fonts.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: THEME.spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  filterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.gray400,
    fontSize: THEME.fonts.sm,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.dark,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray800,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    gap: THEME.spacing.md,
  },
  entryHighlight: {
    backgroundColor: COLORS.gray700,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: THEME.fonts.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: THEME.fonts.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  stat: {
    fontSize: THEME.fonts.sm,
    color: COLORS.gray400,
    marginTop: THEME.spacing.xs,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: THEME.fonts.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: THEME.fonts.xs,
    color: COLORS.gray400,
  },
  loader: {
    marginTop: THEME.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  emptyText: {
    color: COLORS.gray400,
    fontSize: THEME.fonts.base,
  },
  retryButton: {
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.primary,
    fontSize: THEME.fonts.sm,
    fontWeight: '600',
  },
});
