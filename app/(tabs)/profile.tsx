import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/types';
import { COLORS, THEME } from '@/constants/colors';
import { LogOut, Settings } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [user?.id]);

  const fetchBadges = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;

      const { data: allBadges, error: allBadgesError } = await supabase
        .from('badges')
        .select('*');

      if (allBadgesError) throw allBadgesError;

      const earnedIds = new Set((userBadges || []).map((b) => b.badge_id));
      const badgesWithStatus = (allBadges || []).map((badge) => ({
        ...badge,
        earned: earnedIds.has(badge.id),
      }));

      setBadges(badgesWithStatus as Badge[]);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.display_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.display_name || 'User'}</Text>
          <Text style={styles.email}>@{user?.username || 'username'}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user?.total_scans || 0}</Text>
            <Text style={styles.statName}>Scans</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{(user?.best_value_score || 0).toFixed(0)}</Text>
            <Text style={styles.statName}>Best Score</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{badges.filter((b) => b.earned).length}</Text>
            <Text style={styles.statName}>Badges</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : badges.length > 0 ? (
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeItem,
                    !badge.earned && styles.badgeItemLocked,
                  ]}
                >
                  <View
                    style={[
                      styles.badgeIcon,
                      !badge.earned && styles.badgeIconLocked,
                    ]}
                  >
                    <Text style={styles.badgeEmoji}>🎖️</Text>
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  {!badge.earned && (
                    <Text style={styles.locked}>Locked</Text>
                  )}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color={COLORS.primary} />
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={COLORS.danger} />
            <Text style={[styles.settingsText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  avatarText: {
    fontSize: THEME.fonts.xxxl,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  username: {
    fontSize: THEME.fonts.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  email: {
    fontSize: THEME.fonts.base,
    color: COLORS.gray400,
    marginTop: THEME.spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.gray800,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: THEME.fonts.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statName: {
    fontSize: THEME.fonts.sm,
    color: COLORS.gray400,
    marginTop: THEME.spacing.xs,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: THEME.fonts.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: THEME.spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.md,
  },
  badgeItem: {
    width: '32%',
    backgroundColor: COLORS.gray800,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.sm,
  },
  badgeIconLocked: {
    backgroundColor: COLORS.gray700,
  },
  badgeEmoji: {
    fontSize: THEME.fonts.xxl,
  },
  badgeName: {
    fontSize: THEME.fonts.xs,
    color: COLORS.white,
    textAlign: 'center',
  },
  locked: {
    fontSize: THEME.fonts.xs,
    color: COLORS.gray400,
    marginTop: THEME.spacing.xs,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray800,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  settingsText: {
    fontSize: THEME.fonts.lg,
    color: COLORS.white,
    flex: 1,
  },
  signOutText: {
    color: COLORS.danger,
  },
});
