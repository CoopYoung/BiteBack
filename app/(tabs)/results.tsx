import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { saveReceipt, fetchReceipt } from '@/lib/api';
import { calculateValueScore, getScoreColor, getScoreLabel, formatCurrency } from '@/lib/utils';
import { Receipt } from '@/types';
import { COLORS, THEME } from '@/constants/colors';
import { Check, X, Share2, ArrowLeft } from 'lucide-react-native';

export default function ResultsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { receiptId, imageUri } = useLocalSearchParams();

  // View-only mode: navigated from dashboard with just receiptId, no imageUri
  const isViewMode = !!receiptId && !imageUri;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [restaurantName, setRestaurantName] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [total, setTotal] = useState('');
  const [calories, setCalories] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isViewMode && receiptId) {
      loadReceipt(receiptId as string);
    }
  }, [isViewMode, receiptId]);

  const loadReceipt = async (id: string) => {
    setIsLoadingReceipt(true);
    setLoadError(null);
    try {
      const data = await fetchReceipt(id);
      setReceipt(data);
    } catch (err) {
      setLoadError('Failed to load receipt');
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  // In view mode, use the fetched receipt's score; in edit mode, compute live
  const viewScore = receipt?.calories_per_dollar ?? 0;
  const editScore = calculateValueScore(
    parseInt(calories) || 0,
    parseFloat(total) || 0
  );
  const valueScore = isViewMode ? viewScore : editScore;

  const handleSave = async () => {
    if (!restaurantName.trim() || !total || !calories) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseFloat(total) <= 0 || parseInt(calories) <= 0) {
      Alert.alert('Error', 'Total and calories must be positive numbers');
      return;
    }

    if (!receiptId || !user?.id) return;

    setIsLoading(true);
    try {
      await saveReceipt(receiptId as string, user.id, {
        restaurantName,
        subtotal: parseFloat(subtotal) || 0,
        total: parseFloat(total),
        totalCalories: parseInt(calories),
        currentTotalScans: user.total_scans || 0,
        currentBestScore: user.best_value_score || 0,
      });

      Alert.alert('Success', 'Receipt saved!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const label = getScoreLabel(valueScore);
    const name = isViewMode
      ? receipt?.restaurant_name ?? 'a restaurant'
      : restaurantName.trim() || 'a restaurant';
    try {
      await Share.share({
        message: `I scored ${valueScore.toFixed(0)} cal/$ (${label}) at ${name} on Bite Back!`,
      });
    } catch (err) {
      // User cancelled — no action needed
    }
  };

  const hasInput = isViewMode
    ? valueScore > 0
    : parseFloat(total) > 0 && parseInt(calories) > 0;

  // Loading state for view mode
  if (isViewMode && isLoadingReceipt) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.centerLoader} />
      </SafeAreaView>
    );
  }

  if (isViewMode && loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity
            onPress={() => loadReceipt(receiptId as string)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            {isViewMode ? (
              <ArrowLeft size={24} color={COLORS.white} />
            ) : (
              <X size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
          <Text style={styles.title}>
            {isViewMode ? receipt?.restaurant_name ?? 'Receipt' : 'Receipt Details'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {!isViewMode && imageUri && (
          <Image
            source={{ uri: imageUri as string }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        )}

        {isViewMode && receipt ? (
          // Read-only view of receipt data
          <View style={styles.viewSection}>
            <View style={styles.viewRow}>
              <Text style={styles.viewLabel}>Restaurant</Text>
              <Text style={styles.viewValue}>{receipt.restaurant_name}</Text>
            </View>
            <View style={styles.viewRow}>
              <Text style={styles.viewLabel}>Total</Text>
              <Text style={styles.viewValue}>{formatCurrency(receipt.total)}</Text>
            </View>
            <View style={styles.viewRow}>
              <Text style={styles.viewLabel}>Calories</Text>
              <Text style={styles.viewValue}>{receipt.total_calories} cal</Text>
            </View>
          </View>
        ) : (
          // Edit form for new receipts
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Restaurant Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., McDonald's"
                placeholderTextColor={COLORS.gray400}
                value={restaurantName}
                onChangeText={setRestaurantName}
                editable={!isLoading}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Subtotal *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.gray400}
                  value={subtotal}
                  onChangeText={setSubtotal}
                  keyboardType="decimal-pad"
                  editable={!isLoading}
                />
              </View>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Total *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.gray400}
                  value={total}
                  onChangeText={setTotal}
                  keyboardType="decimal-pad"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Total Calories *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.gray400}
                value={calories}
                onChangeText={setCalories}
                keyboardType="number-pad"
                editable={!isLoading}
              />
            </View>
          </View>
        )}

        {hasInput && (
          <View style={styles.preview}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Value Score</Text>
              <Text
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(valueScore) },
                ]}
              >
                {valueScore.toFixed(0)}
              </Text>
              <Text style={styles.scoreUnit}>calories / dollar</Text>

              <View style={styles.scoreDescription}>
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: getScoreColor(valueScore) },
                  ]}
                >
                  <Text style={styles.badgeText}>{getScoreLabel(valueScore)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {!isViewMode && (
            <TouchableOpacity
              style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.dark} />
              ) : (
                <>
                  <Check size={20} color={COLORS.dark} />
                  <Text style={styles.buttonText}>Save Receipt</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.shareButton]}
            disabled={isLoading || !hasInput}
            onPress={handleShare}
          >
            <Share2 size={20} color={COLORS.primary} />
            <Text style={[styles.buttonText, styles.shareButtonText]}>Share</Text>
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
    paddingVertical: THEME.spacing.md,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.lg,
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
  backLink: {
    marginTop: THEME.spacing.md,
  },
  backLinkText: {
    color: COLORS.gray400,
    fontSize: THEME.fonts.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fonts.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.lg,
    backgroundColor: COLORS.gray800,
  },
  viewSection: {
    backgroundColor: COLORS.gray800,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  viewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewLabel: {
    fontSize: THEME.fonts.base,
    color: COLORS.gray400,
  },
  viewValue: {
    fontSize: THEME.fonts.base,
    fontWeight: '600',
    color: COLORS.white,
  },
  form: {
    marginBottom: THEME.spacing.lg,
  },
  formGroup: {
    marginBottom: THEME.spacing.md,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  label: {
    fontSize: THEME.fonts.base,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: THEME.spacing.sm,
  },
  input: {
    backgroundColor: COLORS.gray800,
    borderWidth: 1,
    borderColor: COLORS.gray700,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    color: COLORS.white,
    fontSize: THEME.fonts.base,
  },
  preview: {
    marginBottom: THEME.spacing.lg,
  },
  scoreCard: {
    backgroundColor: COLORS.gray800,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: THEME.fonts.lg,
    color: COLORS.gray400,
    marginBottom: THEME.spacing.sm,
  },
  scoreValue: {
    fontSize: THEME.fonts.xxxl,
    fontWeight: 'bold',
    marginBottom: THEME.spacing.sm,
  },
  scoreUnit: {
    fontSize: THEME.fonts.sm,
    color: COLORS.gray400,
    marginBottom: THEME.spacing.md,
  },
  scoreDescription: {
    marginTop: THEME.spacing.md,
  },
  scoreBadge: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.full,
  },
  badgeText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: THEME.fonts.sm,
  },
  buttonContainer: {
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    gap: THEME.spacing.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  shareButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: THEME.fonts.lg,
  },
  shareButtonText: {
    color: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
