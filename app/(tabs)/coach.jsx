import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useAppStore from '../../src/store/useAppStore';
import { generateCoachMessages } from '../../src/engine/coachMessages';
import CoachCard from '../../components/CoachCard';

export default function CoachScreen() {
  const router = useRouter();
  const { profile, tracker, matchedScholarships, matchedColleges } = useAppStore();

  const messages = generateCoachMessages(profile, tracker, matchedScholarships, matchedColleges);

  const handleAction = (message) => {
    if (message.id === 'no_schools') {
      router.push('/(tabs)/colleges');
    } else if (message.id === 'urgent_deadlines' || message.id === 'scholarship_strategy') {
      router.push('/(tabs)/scholarships');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Your Coach</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Honest, direct guidance — no fluff</Text>
      </View>

      <ScrollView className="flex-1 px-6 mt-2" showsVerticalScrollIndicator={false}>
        {/* Intro card */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-3xl">🎓</Text>
            <View>
              <Text className="text-base font-bold text-gray-900">ScholarCoach</Text>
              <Text className="text-xs text-gray-400">Your personal college counselor</Text>
            </View>
          </View>
          <Text className="text-sm text-gray-600 leading-relaxed">
            I give you the same advice a great college counselor would give — direct, honest, and specific to your situation. No cheerleading. No fluff. Just what you need to hear.
          </Text>
        </View>

        {/* Coach messages */}
        {messages.length > 0 ? (
          messages.map(msg => (
            <CoachCard key={msg.id} message={msg} onAction={handleAction} />
          ))
        ) : (
          <View className="items-center py-10 bg-white rounded-2xl">
            <Text className="text-4xl mb-3">💬</Text>
            <Text className="text-lg font-bold text-gray-900 mb-2">Complete Your Profile</Text>
            <Text className="text-sm text-gray-500 text-center px-4 mb-4">
              Finish setting up your profile to get personalized coaching messages.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/onboarding/welcome')}
              className="rounded-2xl px-6 py-3"
              style={{ backgroundColor: '#1e3a5f' }}>
              <Text className="text-white font-bold">Start Setup →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Principles */}
        <View className="bg-white rounded-2xl p-4 mt-2 mb-4 border border-gray-100">
          <Text className="text-sm font-bold text-gray-900 mb-3">How I Coach</Text>
          {[
            { icon: '🎯', text: 'Direct and honest — I tell you what you need to hear, not what you want to hear.' },
            { icon: '💪', text: 'Your strengths matter as much as your stats. Your story is real.' },
            { icon: '📊', text: 'Data-driven. Matches based on actual eligibility, not guessing.' },
            { icon: '🚫', text: 'No fake cheerleading. If you\'re not competitive, I\'ll tell you and redirect you.' },
          ].map(({ icon, text }, i) => (
            <View key={i} className="flex-row gap-2 mb-2">
              <Text className="text-base">{icon}</Text>
              <Text className="text-sm text-gray-600 flex-1 leading-relaxed">{text}</Text>
            </View>
          ))}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
