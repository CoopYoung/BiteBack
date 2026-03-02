import { useState } from 'react';
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
import { saveReceipt } from '@/lib/api';
import { calculateValueScore, getScoreColor, getScoreLabel } from '@/lib/utils';
import { COLORS, THEME } from '@/constants/colors';
import { Check, X, Share2 } from 'lucide-react-native';

export default function ResultsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { receiptId, imageUri } = useLocalSearchParams();
  const [restaurantName, setRestaurantName] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [total, setTotal] = useState('');
  const [calories, setCalories] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const valueScore = calculateValueScore(
    parseInt(calories) || 0,
    parseFloat(total) || 0
  );

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
    const name = restaurantName.trim() || 'a restaurant';
    try {
      await Share.share({
        message: `I scored ${valueScore.toFixed(0)} cal/$ (${label}) at ${name} on Bite Back!`,
      });
    } catch (err) {
      // User cancelled — no action needed
    }
  };

  const hasInput = parseFloat(total) > 0 && parseInt(calories) > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Receipt Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {imageUri && (
          <Image
            source={{ uri: imageUri as string }}
            style={styles.receiptImage}
            resizeMode="contain"
          />
        )}

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
                    styles.badge,
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
  badge: {
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
