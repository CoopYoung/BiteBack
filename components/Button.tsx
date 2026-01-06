import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, THEME } from '@/constants/colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = variant === 'primary'
    ? styles.buttonPrimary
    : variant === 'danger'
    ? styles.buttonDanger
    : styles.buttonSecondary;

  const textVariantStyle = variant === 'primary'
    ? styles.textPrimary
    : variant === 'danger'
    ? styles.textDanger
    : styles.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyle,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          textVariantStyle,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.gray800,
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  buttonDanger: {
    backgroundColor: COLORS.danger,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    fontSize: THEME.fonts.lg,
  },
  textPrimary: {
    color: COLORS.dark,
  },
  textSecondary: {
    color: COLORS.white,
  },
  textDanger: {
    color: COLORS.white,
  },
});
