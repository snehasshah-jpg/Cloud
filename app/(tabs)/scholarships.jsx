import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import useAppStore from '../../src/store/useAppStore';
import { SCHOLARSHIPS, APPLICATION_STATUSES } from '../../src/data/scholarships';
import ScholarshipCard from '../../components/ScholarshipCard';
import DeadlineBadge from '../../components/DeadlineBadge';

const TABS = ['Green', 'Yellow', 'Blue', 'Saved'];

export default function ScholarshipsScreen() {
  const router = useRouter();
  const { matchedScholarships, tracker, profile } = useAppStore();
  const [activeTab, setActiveTab] = useState('Green');

  const green = matchedScholarships?.green || [];
  const yellow = matchedScholarships?.yellow || [];
  const blue = matchedScholarships?.blue || [];

  const savedIds = tracker?.savedScholarships || [];
  const saved = savedIds
    .map(id => {
      const s = SCHOLARSHIPS.find(sc => sc.id === id);
      const matched = matchedScholarships?.all?.find(ms => ms.id === id);
      return s ? { ...s, ...(matched || {}), trackerStatus: tracker?.scholarships?.[id]?.status || 'not_started' } : null;
    })
    .filter(Boolean);

  const getList = () => {
    switch (activeTab) {
      case 'Yellow': return yellow;
      case 'Blue': return blue;
      case 'Saved': return saved;
      default: return green;
    }
  };

  const tabCounts = {
    Green: green.length,
    Yellow: yellow.length,
    Blue: blue.length,
    Saved: saved.length,
  };

  const TAB_COLORS = {
    Green: '#16a34a',
    Yellow: '#d97706',
    Blue: '#2563eb',
    Saved: '#7c3aed',
  };

  const TAB_DESCRIPTIONS = {
    Green: 'You\'re likely competitive — apply these first.',
    Yellow: 'Worth trying if you have time.',
    Blue: 'Long shots — apply only if you\'re passionate.',
    Saved: 'Your saved scholarships and application tracker.',
  };

  const displayList = getList();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Scholarships</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          {green.length + yellow.length} matches · {green.length} strong fits
        </Text>
      </View>

      {/* Tier tabs */}
      <View className="flex-row px-6 gap-2 mb-1">
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-xl border items-center"
            style={activeTab === tab
              ? { backgroundColor: TAB_COLORS[tab], borderColor: TAB_COLORS[tab] }
              : { backgroundColor: 'white', borderColor: '#e5e7eb' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === tab ? 'white' : TAB_COLORS[tab] }}>
              {tab}
            </Text>
            <Text style={{ fontSize: 11, color: activeTab === tab ? 'rgba(255,255,255,0.8)' : '#9ca3af' }}>
              {tabCounts[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab description */}
      <View className="mx-6 mb-3 mt-1 px-3 py-2 rounded-xl" style={{ backgroundColor: `${TAB_COLORS[activeTab]}15` }}>
        <Text className="text-xs" style={{ color: TAB_COLORS[activeTab] }}>{TAB_DESCRIPTIONS[activeTab]}</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {displayList.length === 0 ? (
          <View className="items-center py-10">
            <Text className="text-4xl mb-3">
              {activeTab === 'Saved' ? '📌' : '🔍'}
            </Text>
            <Text className="text-lg font-bold text-gray-900 mb-2">
              {activeTab === 'Saved' ? 'No Saved Scholarships' : `No ${activeTab} Matches`}
            </Text>
            <Text className="text-sm text-gray-500 text-center px-4">
              {activeTab === 'Saved'
                ? 'Browse your matches and tap "Save" on scholarships you want to track.'
                : 'Complete your profile to see scholarship matches.'}
            </Text>
          </View>
        ) : (
          <>
            {displayList.map(s => <ScholarshipCard key={s.id} scholarship={s} showTier={activeTab !== 'Saved'} />)}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
