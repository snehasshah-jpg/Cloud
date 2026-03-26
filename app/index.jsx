console.log('APP_START');
console.time('APP_LOAD');
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import useAppStore from '../src/store/useAppStore';

export default function IndexScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  // Effect 1: subscribe to Firebase auth state
  useEffect(() => {
    if (!auth) {
      // During static pre-render or if Firebase failed to init
      setAuthChecked(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  // Effect 2: redirect once auth state is known
  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // User is logged in — show splash briefly then navigate
    const timer = setTimeout(() => {
      router.replace(profile.onboardingComplete ? '/(tabs)/dashboard' : '/onboarding/welcome');
    }, 800);
    return () => clearTimeout(timer);
  }, [authChecked, user]);

  console.log('APP_RENDER', { user: !!user, authChecked, profileLoaded: !!profile?.name });
  return (
    <LinearGradient colors={['#1e3a5f', '#2e5d99']} style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 80, marginBottom: 16 }}>🎓</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
          ScholarCoach
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 32 }}>
          Your personal college counselor
        </Text>
        {!authChecked && <ActivityIndicator color="rgba(255,255,255,0.6)" size="large" />}
      </View>
    </LinearGradient>
  );
}
