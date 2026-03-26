import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useAppStore from '../../src/store/useAppStore';
import { COLLEGES } from '../../src/data/colleges';

const TIER_CONFIG = {
  reach: { label: 'Reach School', color: '#dc2626', bg: '#fef2f2' },
  target: { label: 'Target School', color: '#2563eb', bg: '#eff6ff' },
  safety: { label: 'Safety School', color: '#16a34a', bg: '#f0fdf4' },
};

export default function CollegeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { matchedColleges, tracker, saveCollege, removeCollege, updateCollegeStatus } = useAppStore();

  const matched = matchedColleges.find(c => c.id === id);
  const base = COLLEGES.find(c => c.id === id);
  const college = matched || base;

  const isSaved = tracker?.savedColleges?.includes(id);
  const trackerData = tracker?.colleges?.[id] || {};

  if (!college) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">College not found.</Text>
      </SafeAreaView>
    );
  }

  const tier = TIER_CONFIG[college.academicTier] || TIER_CONFIG.target;

  const handleSave = () => {
    if (isSaved) {
      removeCollege(id);
    } else {
      saveCollege(id);
      updateCollegeStatus(id, { status: 'researching' });
    }
  };

  const handleVisited = () => {
    updateCollegeStatus(id, { visited: !trackerData.visited });
    if (!trackerData.visited) {
      Alert.alert('Visit Logged!', 'Your demonstrated interest score has improved.');
    }
  };

  const handleEssayDone = () => {
    updateCollegeStatus(id, { essayDone: !trackerData.essayDone });
  };

  const Stat = ({ label, value }) => (
    <View className="flex-1 items-center py-3 bg-gray-50 rounded-xl">
      <Text className="text-base font-bold text-gray-900">{value || '—'}</Text>
      <Text className="text-xs text-gray-400 text-center mt-0.5">{label}</Text>
    </View>
  );

  const Row = ({ label, value }) => (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900 text-right flex-1 ml-4">{value || '—'}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-base font-medium" style={{ color: '#1e3a5f' }}>← Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-3 mb-2">
            <Text className="text-4xl">{college.emoji}</Text>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">{college.name}</Text>
              <Text className="text-sm text-gray-500">{college.location}</Text>
            </View>
            {college.academicTier && (
              <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: tier.bg }}>
                <Text className="text-xs font-bold" style={{ color: tier.color }}>{tier.label}</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            <View className="bg-gray-100 rounded-full px-3 py-1">
              <Text className="text-xs text-gray-600">{college.type === 'public' ? '🏛️ Public' : '🏫 Private'}</Text>
            </View>
            {college.isHBCU && <View className="bg-purple-100 rounded-full px-3 py-1"><Text className="text-xs text-purple-700 font-semibold">HBCU</Text></View>}
            {college.coopProgram && <View className="bg-green-100 rounded-full px-3 py-1"><Text className="text-xs text-green-700 font-semibold">Co-op</Text></View>}
          </View>

          {/* Key stats row */}
          <View className="flex-row gap-2">
            <Stat label="Admit Rate" value={`${college.admitRate}%`} />
            <Stat label="Net Cost" value={college.estimatedNetCost ? `~$${(college.estimatedNetCost / 1000).toFixed(0)}K/yr` : `$${(college.coa / 1000).toFixed(0)}K/yr`} />
            {college.fitScore && <Stat label="Fit Score" value={`${college.fitScore}%`} />}
          </View>
        </View>

        <View className="px-6 py-4">
          {/* Description */}
          <Text className="text-sm text-gray-600 leading-relaxed mb-4">{college.description}</Text>

          {/* Highlights */}
          {college.highlights && (
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-900 mb-2">Why Consider This School</Text>
              {college.highlights.map((h, i) => (
                <View key={i} className="flex-row items-start gap-2 mb-1.5">
                  <Text className="text-green-500 font-bold">✓</Text>
                  <Text className="text-sm text-gray-700 flex-1">{h}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Academic profile */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-sm font-bold text-gray-900 mb-2">Academic Profile (Middle 50%)</Text>
            <Row label="GPA Range" value={`${college.gpa25} – ${college.gpa75}`} />
            {college.sat25 && <Row label="SAT Range" value={`${college.sat25} – ${college.sat75}`} />}
            {college.act25 && <Row label="ACT Range" value={`${college.act25} – ${college.act75}`} />}
            <Row label="Admit Rate" value={`${college.admitRate}%`} />
          </View>

          {/* Financial */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-sm font-bold text-gray-900 mb-2">Financial Details</Text>
            <Row label="Full Cost of Attendance" value={`$${college.coa?.toLocaleString()}/yr`} />
            {college.meritAidAvg && <Row label="Avg Merit Award" value={`$${college.meritAidAvg?.toLocaleString()}`} />}
            {college.meritAidPct > 0 && <Row label="% Getting Merit Aid" value={`${college.meritAidPct}%`} />}
            <Row label="Avg Net Cost" value={`$${(college.estimatedNetCost || college.avgNetCost || college.coa)?.toLocaleString()}/yr`} />
            <Row label="Need-Blind" value={college.needBlind ? 'Yes' : 'No'} />
            <Row label="Meets Full Need" value={college.meetsFullNeed ? 'Yes' : 'No'} />
          </View>

          {/* Top programs */}
          {college.topMajors && (
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-900 mb-2">Strong Programs</Text>
              <View className="flex-row flex-wrap gap-2">
                {college.topMajors.map(m => (
                  <View key={m} className="bg-blue-50 rounded-full px-3 py-1.5">
                    <Text className="text-xs text-blue-700 font-medium">{m.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tracker section (if saved) */}
          {isSaved && (
            <View className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
              <Text className="text-sm font-bold text-green-800 mb-3">📋 Application Tracker</Text>
              <View className="gap-2">
                <TouchableOpacity
                  onPress={handleVisited}
                  className="flex-row items-center gap-2 py-2"
                >
                  <Text className="text-base">{trackerData.visited ? '✅' : '⬜'}</Text>
                  <Text className="text-sm text-gray-700">Campus visit logged</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEssayDone}
                  className="flex-row items-center gap-2 py-2"
                >
                  <Text className="text-base">{trackerData.essayDone ? '✅' : '⬜'}</Text>
                  <Text className="text-sm text-gray-700">Essays complete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View className="px-6 pb-8 pt-4 border-t border-gray-100 gap-3">
        <TouchableOpacity
          onPress={handleSave}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: isSaved ? '#dc2626' : '#1e3a5f' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">
            {isSaved ? 'Remove from My List' : '+ Add to My College List'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
