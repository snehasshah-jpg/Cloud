import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useAppStore from '../../src/store/useAppStore';
import { calculateReadinessScore, generateReadinessNarrative } from '../../src/engine/readinessScore';
import { getDashboardTip } from '../../src/engine/coachMessages';
import ReadinessGauge from '../../components/ReadinessGauge';
import ScholarshipCard from '../../components/ScholarshipCard';
import SchoolCard from '../../components/SchoolCard';
import { COLLEGES } from '../../src/data/colleges';
import { SCHOLARSHIPS } from '../../src/data/scholarships';

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, tracker, matchedScholarships, matchedColleges } = useAppStore();

  // Compute readiness score
  const collegeList = matchedColleges.length > 0
    ? { reach: matchedColleges.filter(c => c.academicTier === 'reach'), target: matchedColleges.filter(c => c.academicTier === 'target') }
    : { reach: [], target: [] };

  const readiness = calculateReadinessScore(profile, tracker, collegeList);
  const narrative = generateReadinessNarrative(readiness, profile);
  const tip = getDashboardTip(profile, tracker, matchedScholarships);

  // Urgent scholarships (green tier, deadline ≤ 14 days)
  const urgentScholarships = (matchedScholarships?.green || []).filter(s => s.daysUntilDeadline <= 14).slice(0, 2);

  // Top colleges
  const topColleges = matchedColleges.slice(0, 3);

  // Recent tracker items
  const savedScholarshipIds = tracker?.savedScholarships || [];
  const inProgressScholarships = savedScholarshipIds
    .map(id => {
      const s = SCHOLARSHIPS.find(sc => sc.id === id);
      const status = tracker?.scholarships?.[id];
      return s ? { ...s, ...(matchedScholarships?.all?.find(ms => ms.id === id) || {}), trackerStatus: status?.status || 'not_started' } : null;
    })
    .filter(Boolean)
    .slice(0, 2);

  const readinessColor = readiness.total >= 80 ? '#16a34a' : readiness.total >= 60 ? '#d97706' : '#dc2626';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">
            {profile.name ? `Hey, ${profile.name} 👋` : 'Dashboard 👋'}
          </Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            {profile.grade === 'junior' ? '11th Grade' : profile.grade === 'senior' ? '12th Grade' : 'High School'} · Your college prep overview
          </Text>
        </View>

        {/* Readiness Score Card */}
        <View className="mx-6 mt-2 mb-4 bg-white rounded-3xl p-5 shadow-sm">
          <Text className="text-base font-bold text-gray-900 mb-4">Application Readiness</Text>
          <View className="flex-row items-center gap-4">
            <ReadinessGauge score={readiness.total} size={120} />
            <View className="flex-1">
              {Object.values(readiness.categories).map((cat) => (
                <View key={cat.label} className="mb-2">
                  <View className="flex-row justify-between mb-0.5">
                    <Text className="text-xs text-gray-500 flex-1" numberOfLines={1}>{cat.label}</Text>
                    <Text className="text-xs font-semibold text-gray-700">{cat.score}/{cat.max}</Text>
                  </View>
                  <View className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View style={{ width: `${(cat.score / cat.max) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: readinessColor }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View className="mt-4 bg-gray-50 rounded-xl p-3">
            <Text className="text-sm text-gray-700 leading-relaxed">{narrative}</Text>
          </View>
        </View>

        {/* Coach Tip */}
        <View className="mx-6 mb-4 bg-navy-700 rounded-2xl p-4" style={{ backgroundColor: '#1e3a5f' }}>
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-base">🧠</Text>
            <Text className="text-white font-bold text-sm">Coach Says</Text>
          </View>
          <Text className="text-blue-100 text-sm leading-relaxed">{tip}</Text>
        </View>

        {/* Urgent Deadlines */}
        {urgentScholarships.length > 0 && (
          <View className="px-6 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-gray-900">⏰ Urgent Deadlines</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/scholarships')}>
                <Text className="text-sm font-medium" style={{ color: '#1e3a5f' }}>See all</Text>
              </TouchableOpacity>
            </View>
            {urgentScholarships.map(s => <ScholarshipCard key={s.id} scholarship={s} />)}
          </View>
        )}

        {/* My Scholarships (saved) */}
        {inProgressScholarships.length > 0 && (
          <View className="px-6 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-gray-900">📋 Saved Scholarships</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/scholarships')}>
                <Text className="text-sm font-medium" style={{ color: '#1e3a5f' }}>See all</Text>
              </TouchableOpacity>
            </View>
            {inProgressScholarships.map(s => <ScholarshipCard key={s.id} scholarship={s} showTier={false} />)}
          </View>
        )}

        {/* College List Preview */}
        {topColleges.length > 0 && (
          <View className="px-6 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-gray-900">🏛️ Your College List</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/colleges')}>
                <Text className="text-sm font-medium" style={{ color: '#1e3a5f' }}>See all</Text>
              </TouchableOpacity>
            </View>
            {topColleges.map(c => <SchoolCard key={c.id} college={c} />)}
          </View>
        )}

        {/* Empty state */}
        {topColleges.length === 0 && (matchedScholarships?.green?.length || 0) === 0 && (
          <View className="mx-6 mb-6 items-center py-8 bg-white rounded-3xl">
            <Text className="text-4xl mb-3">🎓</Text>
            <Text className="text-lg font-bold text-gray-900 mb-2">Let's Get Started</Text>
            <Text className="text-sm text-gray-500 text-center px-4 leading-relaxed mb-4">
              Complete your profile to get personalized college + scholarship matches.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/onboarding/welcome')}
              className="rounded-2xl px-6 py-3"
              style={{ backgroundColor: '#1e3a5f' }}>
              <Text className="text-white font-bold">Start Setup →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
