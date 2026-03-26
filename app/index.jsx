import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '../src/store/useAppStore';

export default function IndexScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const authLoading = useAppStore((s) => s.authLoading);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    // Wait for Firebase auth to resolve before redirecting
    if (authLoading) return;
    // If not logged in, AuthGate in _layout will handle the redirect to /auth/login
    if (!user) return;

    const timer = setTimeout(() => {
      if (profile.onboardingComplete) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/onboarding/welcome');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [authLoading, user]);

  return (
    <LinearGradient colors={['#1e3a5f', '#2e5d99']} style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 80, marginBottom: 16 }}>🎓</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
          ScholarCoach
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>
          Your personal college counselor
        </Text>
      </View>
    </LinearGradient>
  );
}
