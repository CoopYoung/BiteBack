import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Receipt } from '@/types';
import { COLORS, THEME } from '@/constants/colors';
import { Camera } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, [user?.id]);

  const fetchReceipts = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getValueColor = (value?: number) => {
    if (!value) return COLORS.gray500;
    if (value >= 150) return COLORS.excellent;
    if (value >= 50) return COLORS.good;
    return COLORS.poor;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : receipts.length > 0 ? (
            <View style={styles.receiptsList}>
              {receipts.map((receipt) => (
                <TouchableOpacity key={receipt.id} style={styles.receiptCard}>
                  <View style={styles.receiptHeader}>
                    <Text style={styles.restaurantName}>{receipt.restaurant_name}</Text>
                    <Text
                      style={[
                        styles.value,
                        { color: getValueColor(receipt.calories_per_dollar) },
                      ]}
                    >
                      {receipt.calories_per_dollar?.toFixed(0) || 0} cals/$
                    </Text>
                  </View>
                  <View style={styles.receiptFooter}>
                    <Text style={styles.stats}>
                      {receipt.total_calories} cal · ${receipt.total.toFixed(2)}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No scans yet. Start with your first meal!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
  },
  header: {
    marginBottom: THEME.spacing.xl,
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
    marginBottom: THEME.spacing.xl,
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
    marginBottom: THEME.spacing.xl,
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
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fonts.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: THEME.spacing.md,
  },
  receiptsList: {
    gap: THEME.spacing.md,
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
});
