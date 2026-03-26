import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '../../src/store/useAppStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const updateProfile = useAppStore((s) => s.updateProfile);

  const handleStart = () => {
    router.push('/onboarding/quiz-passion');
  };

  const handleSkipQuiz = () => {
    router.push('/onboarding/academic');
  };

  return (
    <LinearGradient colors={['#1e3a5f', '#2e5d99']} className="flex-1">
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 justify-center items-center">
          <Text className="text-6xl mb-4">🎓</Text>
          <Text className="text-4xl font-bold text-white text-center leading-tight mb-3">
            ScholarCoach
          </Text>
          <Text className="text-lg text-blue-200 text-center leading-relaxed mb-2">
            Your personal college counselor.
          </Text>
          <Text className="text-base text-blue-300 text-center leading-relaxed px-4">
            We'll match you with scholarships, build your college list, and coach you every step of the way.
          </Text>
        </View>

        <View className="mb-8 gap-4">
          <View className="bg-white/10 rounded-2xl p-4">
            <View className="flex-row items-center gap-3 mb-1">
              <Text className="text-2xl">💡</Text>
              <Text className="text-white font-semibold text-base">Start with the Discovery Quiz</Text>
            </View>
            <Text className="text-blue-200 text-sm leading-relaxed">
              10–15 min quiz to find your best-fit fields of study, then we build your college + scholarship list.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleStart}
            className="bg-white rounded-2xl py-4 items-center"
            activeOpacity={0.85}
          >
            <Text className="text-navy-700 font-bold text-lg" style={{ color: '#1e3a5f' }}>
              Start the Quiz →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkipQuiz}
            className="items-center py-2"
            activeOpacity={0.7}
          >
            <Text className="text-blue-300 text-sm">Skip quiz — enter my profile directly</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
