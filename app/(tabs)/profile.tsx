import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserBadges, updateUserProfile } from '@/lib/api';
import { Badge } from '@/types';
import { COLORS, THEME } from '@/constants/colors';
import { LogOut, Settings, Check, X } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.display_name ?? '');
  const [editCity, setEditCity] = useState(user?.city ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBadges();
  }, [user?.id]);

  useEffect(() => {
    setEditName(user?.display_name ?? '');
    setEditCity(user?.city ?? '');
  }, [user?.display_name, user?.city]);

  const loadBadges = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserBadges(user.id);
      setBadges(data);
    } catch (err) {
      setError('Failed to load badges');
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
          } catch (err) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel — reset fields
      setEditName(user?.display_name ?? '');
      setEditCity(user?.city ?? '');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(user.id, {
        display_name: trimmedName,
        city: editCity.trim() || undefined,
      });
      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBadgeItem = useCallback(
    ({ item }: { item: Badge }) => (
      <View
        style={[
          styles.badgeItem,
          !item.earned && styles.badgeItemLocked,
        ]}
      >
        <View
          style={[
            styles.badgeIcon,
            !item.earned && styles.badgeIconLocked,
          ]}
        >
          <Text style={styles.badgeEmoji}>
            {item.icon_url || '\uD83C\uDF96\uFE0F'}
          </Text>
        </View>
        <Text style={styles.badgeName}>{item.name}</Text>
        {!item.earned && (
          <Text style={styles.locked}>Locked</Text>
        )}
      </View>
    ),
    []
  );

  const badgeKeyExtractor = useCallback((item: Badge) => item.id, []);

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.display_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Display name"
              placeholderTextColor={COLORS.gray400}
              editable={!isSaving}
            />
            <TextInput
              style={styles.editInput}
              value={editCity}
              onChangeText={setEditCity}
              placeholder="City (optional)"
              placeholderTextColor={COLORS.gray400}
              editable={!isSaving}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editSaveButton}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.dark} />
                ) : (
                  <>
                    <Check size={16} color={COLORS.dark} />
                    <Text style={styles.editSaveText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={handleEditToggle}
                disabled={isSaving}
              >
                <X size={16} color={COLORS.gray400} />
                <Text style={styles.editCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.username}>{user?.display_name || 'User'}</Text>
            <Text style={styles.email}>@{user?.username || 'username'}</Text>
            {user?.city ? (
              <Text style={styles.cityText}>{user.city}</Text>
            ) : null}
          </>
        )}
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

      <Text style={styles.sectionTitle}>Achievements</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : error ? (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadBadges} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  const renderFooter = () => (
    <View style={styles.footerSection}>
      <TouchableOpacity style={styles.settingsButton} onPress={handleEditToggle}>
        <Settings size={20} color={COLORS.primary} />
        <Text style={styles.settingsText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.settingsButton, styles.signOutButton]}
        onPress={handleSignOut}
      >
        <LogOut size={20} color={COLORS.danger} />
        <Text style={[styles.settingsText, styles.signOutText]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  // Only show badges in FlatList data when loaded and no error
  const badgeData = !isLoading && !error ? badges : [];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={badgeData}
        renderItem={renderBadgeItem}
        keyExtractor={badgeKeyExtractor}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.content}
        columnWrapperStyle={badgeData.length > 0 ? styles.badgesRow : undefined}
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
  cityText: {
    fontSize: THEME.fonts.sm,
    color: COLORS.gray500,
    marginTop: THEME.spacing.xs,
  },
  editForm: {
    width: '100%',
    gap: THEME.spacing.sm,
  },
  editInput: {
    backgroundColor: COLORS.gray800,
    borderWidth: 1,
    borderColor: COLORS.gray700,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    color: COLORS.white,
    fontSize: THEME.fonts.base,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  editSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    gap: THEME.spacing.xs,
  },
  editSaveText: {
    color: COLORS.dark,
    fontWeight: '600',
    fontSize: THEME.fonts.sm,
  },
  editCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray700,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    gap: THEME.spacing.xs,
  },
  editCancelText: {
    color: COLORS.gray400,
    fontWeight: '600',
    fontSize: THEME.fonts.sm,
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
  sectionTitle: {
    fontSize: THEME.fonts.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: THEME.spacing.md,
  },
  badgesRow: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  badgeItem: {
    flex: 1,
    maxWidth: '33%',
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
  errorState: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
  },
  errorText: {
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
  footerSection: {
    marginTop: THEME.spacing.xl,
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
