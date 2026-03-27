import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// This screen pre-renders visible content (avoids blank page) and immediately
// navigates to the login screen once JavaScript loads.
// Auth check (redirect to dashboard if already signed in) happens in login.jsx.
export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login');
  }, []);

  return (
    <LinearGradient colors={['#1e3a5f', '#2e5d99']} style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 64, marginBottom: 12 }}>🎓</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>
          ScholarCoach
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 48 }}>
          Your personal college counselor
        </Text>
        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Tap to continue →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
