import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import useAppStore from '../../src/store/useAppStore';
import SchoolCard from '../../components/SchoolCard';

const TABS = ['All', 'Reach', 'Target', 'Safety', 'Saved'];

export default function CollegesScreen() {
  const router = useRouter();
  const { matchedColleges, tracker, profile } = useAppStore();
  const [activeTab, setActiveTab] = useState('All');

  const reaches = matchedColleges.filter(c => c.academicTier === 'reach');
  const targets = matchedColleges.filter(c => c.academicTier === 'target');
  const safeties = matchedColleges.filter(c => c.academicTier === 'safety');
  const saved = matchedColleges.filter(c => tracker?.savedColleges?.includes(c.id));

  const getDisplayList = () => {
    switch (activeTab) {
      case 'Reach': return reaches;
      case 'Target': return targets;
      case 'Safety': return safeties;
      case 'Saved': return saved;
      default: return matchedColleges;
    }
  };

  const displayList = getDisplayList();

  const TierSection = ({ label, colleges, color }) => {
    if (colleges.length === 0) return null;
    return (
      <View className="mb-2">
        <Text className="text-sm font-bold mb-2 px-1" style={{ color }}>{label} ({colleges.length})</Text>
        {colleges.map(c => <SchoolCard key={c.id} college={c} />)}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">College List</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{matchedColleges.length} matched schools</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-2" contentContainerStyle={{ gap: 8 }}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-full border"
            style={activeTab === tab
              ? { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' }
              : { backgroundColor: 'white', borderColor: '#e5e7eb' }}
          >
            <Text style={{ fontSize: 13, fontWeight: activeTab === tab ? '700' : '400', color: activeTab === tab ? 'white' : '#6b7280' }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {matchedColleges.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">🏛️</Text>
            <Text className="text-lg font-bold text-gray-900 mb-2">No College List Yet</Text>
            <Text className="text-sm text-gray-500 text-center px-4 mb-4">
              Complete your profile (GPA, preferences, location) to get a personalized reach/target/safety list.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/onboarding/academic')}
              className="rounded-2xl px-6 py-3"
              style={{ backgroundColor: '#1e3a5f' }}>
              <Text className="text-white font-bold">Complete Profile →</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'All' ? (
          <>
            <TierSection label="🎯 Reach Schools" colleges={reaches} color="#dc2626" />
            <TierSection label="🎓 Target Schools" colleges={targets} color="#2563eb" />
            <TierSection label="✅ Safety Schools" colleges={safeties} color="#16a34a" />
          </>
        ) : (
          <>
            {displayList.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-3xl mb-2">🤷</Text>
                <Text className="text-gray-500 text-center">No {activeTab.toLowerCase()} schools in your list.</Text>
              </View>
            ) : (
              displayList.map(c => <SchoolCard key={c.id} college={c} />)
            )}
          </>
        )}

        {/* Summary card */}
        {matchedColleges.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <Text className="text-sm font-bold text-gray-900 mb-2">Your List Summary</Text>
            <View className="flex-row gap-4">
              <View className="flex-1 items-center py-2 bg-red-50 rounded-xl">
                <Text className="text-xl font-bold text-red-600">{reaches.length}</Text>
                <Text className="text-xs text-red-400">Reach</Text>
              </View>
              <View className="flex-1 items-center py-2 bg-blue-50 rounded-xl">
                <Text className="text-xl font-bold text-blue-600">{targets.length}</Text>
                <Text className="text-xs text-blue-400">Target</Text>
              </View>
              <View className="flex-1 items-center py-2 bg-green-50 rounded-xl">
                <Text className="text-xl font-bold text-green-600">{safeties.length}</Text>
                <Text className="text-xs text-green-400">Safety</Text>
              </View>
            </View>
            <Text className="text-xs text-gray-400 mt-2 text-center">
              Ideal: 2-3 reaches, 4-6 targets, 3-4 safeties
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
