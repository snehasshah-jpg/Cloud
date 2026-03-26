import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useAppStore from '../../src/store/useAppStore';
import { SCHOLARSHIPS, SCHOLARSHIP_CATEGORIES, APPLICATION_STATUSES } from '../../src/data/scholarships';
import TierBadge from '../../components/TierBadge';
import DeadlineBadge from '../../components/DeadlineBadge';

const EFFORT_LABELS = ['', 'No essay', '1 short essay', 'Essay + transcript', 'Multiple essays + recs', '3+ essays + recs + docs'];

export default function ScholarshipDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { matchedScholarships, tracker, saveScholarship, removeScholarship, updateScholarshipStatus } = useAppStore();

  const base = SCHOLARSHIPS.find(s => s.id === id);
  const matched = matchedScholarships?.all?.find(s => s.id === id);
  const scholarship = matched || base;

  const isSaved = tracker?.savedScholarships?.includes(id);
  const trackerData = tracker?.scholarships?.[id] || {};
  const currentStatus = trackerData.status || 'not_started';

  if (!scholarship) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Scholarship not found.</Text>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    if (isSaved) {
      removeScholarship(id);
    } else {
      saveScholarship(id);
      updateScholarshipStatus(id, { status: 'not_started' });
    }
  };

  const handleStatusChange = (status) => {
    updateScholarshipStatus(id, { status });
  };

  const handleApply = () => {
    if (scholarship.url) {
      Linking.openURL(scholarship.url).catch(() =>
        Alert.alert('Error', 'Could not open the application URL.')
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-base font-medium" style={{ color: '#1e3a5f' }}>← Back</Text>
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-900 mb-1">{scholarship.name}</Text>
          <Text className="text-sm text-gray-400 mb-3">{SCHOLARSHIP_CATEGORIES[scholarship.category]}</Text>

          <View className="flex-row flex-wrap gap-2 mb-3">
            {scholarship.tier && <TierBadge tier={scholarship.tier} />}
            <DeadlineBadge deadline={scholarship.deadline} daysUntil={scholarship.daysUntilDeadline} />
          </View>

          {/* Key stats */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-navy-50 rounded-xl p-3 items-center" style={{ backgroundColor: '#e8eef7' }}>
              <Text className="text-lg font-bold" style={{ color: '#1e3a5f' }}>
                ${(scholarship.amount / 1000).toFixed(0)}K{scholarship.amount >= 100000 ? '+' : ''}
              </Text>
              <Text className="text-xs text-gray-500">Award</Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-xl p-3 items-center">
              <Text className="text-lg font-bold text-gray-900">{EFFORT_LABELS[scholarship.effort]?.split(' ')[0] || '—'}</Text>
              <Text className="text-xs text-gray-500">Effort</Text>
            </View>
            {scholarship.matchPct !== undefined && (
              <View className="flex-1 bg-gray-50 rounded-xl p-3 items-center">
                <Text className="text-lg font-bold text-gray-900">{scholarship.matchPct}%</Text>
                <Text className="text-xs text-gray-500">Your Match</Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-6 py-4">
          {/* Coach message */}
          {scholarship.coachMessage && (
            <View className="bg-blue-50 rounded-xl p-4 mb-4 border-l-4" style={{ borderLeftColor: '#2563eb' }}>
              <Text className="text-sm font-bold text-blue-800 mb-1">🧠 Coach Says</Text>
              <Text className="text-sm text-blue-700 leading-relaxed">{scholarship.coachMessage}</Text>
            </View>
          )}

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-bold text-gray-900 mb-2">About This Scholarship</Text>
            <Text className="text-sm text-gray-600 leading-relaxed">{scholarship.description}</Text>
            {scholarship.notes && (
              <Text className="text-sm text-gray-500 leading-relaxed mt-2 italic">{scholarship.notes}</Text>
            )}
          </View>

          {/* Award details */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-sm font-bold text-gray-900 mb-2">Award Details</Text>
            <View className="gap-1">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Amount</Text>
                <Text className="text-sm font-medium text-gray-900">{scholarship.amountDisplay}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Renewable</Text>
                <Text className="text-sm font-medium text-gray-900">{scholarship.renewable ? 'Yes (annual)' : 'One-time'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Effort Required</Text>
                <Text className="text-sm font-medium text-gray-900">{EFFORT_LABELS[scholarship.effort]}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Deadline</Text>
                <Text className="text-sm font-medium text-gray-900">{scholarship.deadline}</Text>
              </View>
            </View>
          </View>

          {/* Eligibility criteria */}
          {scholarship.criteria && scholarship.criteria.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-900 mb-2">Eligibility Breakdown</Text>
              {scholarship.criteria.map((c, i) => (
                <View key={i} className="flex-row items-center gap-2 py-1.5 border-b border-gray-50">
                  <Text style={{ fontSize: 16 }}>{c.met ? '✅' : '❌'}</Text>
                  <Text className="text-sm flex-1" style={{ color: c.met ? '#374151' : '#9ca3af' }}>{c.name}</Text>
                  {c.critical && !c.met && (
                    <View className="bg-red-100 rounded px-1.5 py-0.5">
                      <Text className="text-xs text-red-600 font-medium">Required</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Application status (if saved) */}
          {isSaved && (
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-900 mb-2">Application Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {APPLICATION_STATUSES.map(status => (
                  <TouchableOpacity
                    key={status.value}
                    onPress={() => handleStatusChange(status.value)}
                    className="px-3 py-2 rounded-xl border"
                    style={currentStatus === status.value
                      ? { backgroundColor: status.color, borderColor: status.color }
                      : { backgroundColor: 'white', borderColor: '#e5e7eb' }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: currentStatus === status.value ? 'white' : '#6b7280',
                    }}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View className="px-6 pb-8 pt-4 border-t border-gray-100 gap-3">
        <TouchableOpacity
          onPress={handleApply}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: '#1e3a5f' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-base">Open Application →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          className="rounded-2xl py-4 items-center border-2"
          style={{ borderColor: isSaved ? '#dc2626' : '#1e3a5f' }}
          activeOpacity={0.85}
        >
          <Text className="font-bold text-base" style={{ color: isSaved ? '#dc2626' : '#1e3a5f' }}>
            {isSaved ? 'Remove from Saved' : '+ Save to Tracker'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
