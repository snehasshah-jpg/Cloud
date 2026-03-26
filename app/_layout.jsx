import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import useAppStore from '../src/store/useAppStore';
import '../global.css';

function AuthGate({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const setUser = useAppStore((s) => s.setUser);
  const user = useAppStore((s) => s.user);
  const authLoading = useAppStore((s) => s.authLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authLoading) return; // still waiting for Firebase
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, authLoading, segments]);

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scholarship/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="college/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthGate>
    </SafeAreaProvider>
  );
}
