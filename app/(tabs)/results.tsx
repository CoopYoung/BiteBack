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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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

  const calculateValue = () => {
    const totalNum = parseFloat(total) || 0;
    const caloriesNum = parseInt(calories) || 0;
    return totalNum > 0 ? (caloriesNum / totalNum).toFixed(2) : '0';
  };

  const getValueColor = (value: number) => {
    if (value >= 150) return COLORS.excellent;
    if (value >= 50) return COLORS.good;
    return COLORS.poor;
  };

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
      const subtotalNum = parseFloat(subtotal) || 0;
      const totalNum = parseFloat(total);
      const caloriesNum = parseInt(calories);
      const tax = totalNum - subtotalNum;
      const valueScore = caloriesNum / totalNum;

      const { error } = await supabase
        .from('receipts')
        .update({
          restaurant_name: restaurantName,
          subtotal: subtotalNum,
          tax: Math.max(0, tax),
          total: totalNum,
          total_calories: caloriesNum,
          calories_per_dollar: parseFloat(valueScore.toFixed(2)),
          value_score: Math.round(valueScore),
        })
        .eq('id', receiptId);

      if (error) throw error;

      // Update user stats atomically
      const newTotalScans = (user.total_scans || 0) + 1;
      const newBestScore = Math.max(user.best_value_score || 0, valueScore);
      const { error: userError } = await supabase
        .from('users')
        .update({
          total_scans: newTotalScans,
          best_value_score: newBestScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (userError) console.warn('Failed to update user stats:', userError);

      Alert.alert('Success', 'Receipt saved!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const valueScore = parseFloat(calculateValue());

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Receipt Details</Text>
          <View style={{ width: 24 }} />
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

        {total && calories && (
          <View style={styles.preview}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Value Score</Text>
              <Text
                style={[
                  styles.scoreValue,
                  { color: getValueColor(valueScore) },
                ]}
              >
                {valueScore.toFixed(0)}
              </Text>
              <Text style={styles.scoreUnit}>calories / dollar</Text>

              <View style={styles.scoreDescription}>
                {valueScore >= 150 ? (
                  <>
                    <View style={styles.badgeGood}>
                      <Text style={styles.badgeText}>Excellent Deal</Text>
                    </View>
                  </>
                ) : valueScore >= 50 ? (
                  <>
                    <View style={styles.badgeOk}>
                      <Text style={styles.badgeText}>Fair Value</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.badgePoor}>
                      <Text style={styles.badgeText}>Poor Value</Text>
                    </View>
                  </>
                )}
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
            disabled={isLoading}
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
  badgeGood: {
    backgroundColor: COLORS.excellent,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.full,
  },
  badgeOk: {
    backgroundColor: COLORS.good,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.full,
  },
  badgePoor: {
    backgroundColor: COLORS.poor,
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
