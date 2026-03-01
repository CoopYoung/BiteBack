import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, THEME } from '@/constants/colors';

export function SplashScreen() {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.logo}>🧾</Text>
        <Text style={styles.title}>BITE BACK</Text>
        <Text style={styles.tagline}>More bread for your bread</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fonts.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: THEME.spacing.md,
  },
  tagline: {
    fontSize: THEME.fonts.lg,
    color: COLORS.gray400,
    letterSpacing: 1,
  },
});
