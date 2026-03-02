import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRecentReceipts } from '@/lib/api';
import { getScoreColor, formatCurrency, formatDate } from '@/lib/utils';
import { Receipt } from '@/types';
import { COLORS, THEME } from '@/constants/colors';
import { Camera } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReceipts();
  }, [user?.id]);

  const loadReceipts = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRecentReceipts(user.id, 5);
      setReceipts(data);
    } catch (err) {
      setError('Failed to load recent scans');
    } finally {
      setIsLoading(false);
    }
  };

  const renderReceiptItem = useCallback(
    ({ item }: { item: Receipt }) => (
      <View style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
          <Text
            style={[
              styles.value,
              { color: getScoreColor(item.calories_per_dollar ?? 0) },
            ]}
          >
            {item.calories_per_dollar?.toFixed(0) || 0} cals/$
          </Text>
        </View>
        <View style={styles.receiptFooter}>
          <Text style={styles.stats}>
            {item.total_calories} cal · {formatCurrency(item.total)}
          </Text>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item: Receipt) => item.id, []);

  const renderListHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.username}>{user?.display_name || 'Friend'}</Text>
      </View>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/(tabs)/scan')}
      >
        <Camera size={24} color={COLORS.dark} />
        <Text style={styles.scanButtonText}>Start Scanning</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{user?.total_scans || 0}</Text>
          <Text style={styles.statLabel}>Scans</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{(user?.best_value_score || 0).toFixed(0)}</Text>
          <Text style={styles.statLabel}>Best Score</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Scans</Text>
    </>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />;
    }
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={loadReceipts} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No scans yet. Start with your first meal!</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={receipts}
        renderItem={renderReceiptItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  header: {
    marginBottom: THEME.spacing.lg,
  },
  welcome: {
    fontSize: THEME.fonts.lg,
    color: COLORS.gray400,
    marginBottom: THEME.spacing.sm,
  },
  username: {
    fontSize: THEME.fonts.xxxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  scanButtonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: THEME.fonts.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  stat: {
    flex: 1,
    backgroundColor: COLORS.gray800,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: THEME.fonts.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: THEME.fonts.sm,
    color: COLORS.gray400,
    marginTop: THEME.spacing.xs,
  },
  sectionTitle: {
    fontSize: THEME.fonts.xl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  receiptCard: {
    backgroundColor: COLORS.gray800,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  restaurantName: {
    flex: 1,
    fontSize: THEME.fonts.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  value: {
    fontWeight: 'bold',
    fontSize: THEME.fonts.lg,
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    fontSize: THEME.fonts.sm,
    color: COLORS.gray400,
  },
  date: {
    fontSize: THEME.fonts.sm,
    color: COLORS.gray500,
  },
  loader: {
    marginVertical: THEME.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
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
