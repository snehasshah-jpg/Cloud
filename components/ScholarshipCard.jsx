import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import TierBadge from './TierBadge';
import DeadlineBadge from './DeadlineBadge';

export default function ScholarshipCard({ scholarship, showTier = true }) {
  const router = useRouter();

  const formatAmount = (amount) => {
    if (amount >= 100000) return `$${(amount / 1000).toFixed(0)}K+`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const effortLabel = ['', 'No essay', 'Short essay', 'Essay + docs', 'Multiple essays', '3+ essays + recs'];

  return (
    <TouchableOpacity
      onPress={() => router.push(`/scholarship/${scholarship.id}`)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-gray-900 leading-tight" numberOfLines={2}>
            {scholarship.name}
          </Text>
        </View>
        <Text className="text-base font-bold text-navy-700">
          {formatAmount(scholarship.amount)}
        </Text>
      </View>

      <Text className="text-sm text-gray-500 mb-3" numberOfLines={2}>
        {scholarship.description}
      </Text>

      <View className="flex-row items-center justify-between flex-wrap gap-2">
        {showTier && <TierBadge tier={scholarship.tier} compact />}
        <DeadlineBadge deadline={scholarship.deadline} daysUntil={scholarship.daysUntilDeadline} compact />
        <Text className="text-xs text-gray-400">{effortLabel[scholarship.effort] || ''}</Text>
      </View>

      {scholarship.matchPct !== undefined && (
        <View className="mt-3 flex-row items-center">
          <View className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <View
              style={{
                width: `${scholarship.matchPct}%`,
                height: '100%',
                borderRadius: 4,
                backgroundColor:
                  scholarship.tier === 'green' ? '#16a34a' :
                  scholarship.tier === 'yellow' ? '#d97706' :
                  scholarship.tier === 'blue' ? '#2563eb' : '#6b7280',
              }}
            />
          </View>
          <Text className="text-xs text-gray-400 ml-2">{scholarship.matchPct}% match</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
