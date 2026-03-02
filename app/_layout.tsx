import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SplashScreen } from '@/components/SplashScreen';

function RootLayoutContent() {
  const { isSignedIn, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return <SplashScreen />;
  }

  const inAuthGroup = segments[0] === '(auth)';

  // Redirect unauthenticated users to sign-in
  if (!isSignedIn && !inAuthGroup) {
    return <Redirect href="/(auth)" />;
  }

  // Redirect authenticated users to the main app
  if (isSignedIn && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
