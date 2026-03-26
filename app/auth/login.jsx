import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../src/config/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth() {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace('/');
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (Platform.OS !== 'web') return;
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace('/');
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#1e3a5f', '#2e5d99']} style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Logo */}
        <Text style={{ fontSize: 64, marginBottom: 12 }}>🎓</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>
          ScholarCoach
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
          Your personal college counselor
        </Text>

        {/* Card */}
        <View style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 24,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 8,
        }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20, textAlign: 'center' }}>
            {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
          </Text>

          {/* Google button — web only */}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={handleGoogle}
              disabled={loading}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 10,
                paddingVertical: 12,
                marginBottom: 16,
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 18 }}>G</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          )}

          {Platform.OS === 'web' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
              <Text style={{ marginHorizontal: 12, color: '#9ca3af', fontSize: 13 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
            </View>
          )}

          {/* Email */}
          <TextInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              marginBottom: 12,
              color: '#111827',
            }}
          />

          {/* Password */}
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              marginBottom: 16,
              color: '#111827',
            }}
          />

          {/* Error */}
          {error ? (
            <Text style={{ color: '#dc2626', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleEmailAuth}
            disabled={loading}
            style={{
              backgroundColor: '#1e3a5f',
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle mode */}
          <TouchableOpacity onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>
            <Text style={{ textAlign: 'center', color: '#2e5d99', fontSize: 14 }}>
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
