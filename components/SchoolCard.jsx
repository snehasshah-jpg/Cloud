import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const TIER_STYLE = {
  reach: { label: 'Reach', bg: 'bg-red-100', text: 'text-red-700' },
  target: { label: 'Target', bg: 'bg-blue-100', text: 'text-blue-700' },
  safety: { label: 'Safety', bg: 'bg-green-100', text: 'text-green-700' },
};

export default function SchoolCard({ college, showTier = true }) {
  const router = useRouter();
  const tier = TIER_STYLE[college.academicTier] || TIER_STYLE.target;

  const formatNetCost = (cost) => {
    if (!cost) return 'See website';
    return `~$${(cost / 1000).toFixed(0)}K/yr net`;
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/college/${college.id}`)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-1">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2 mb-0.5">
            <Text className="text-xl">{college.emoji}</Text>
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {college.name}
            </Text>
          </View>
          <Text className="text-sm text-gray-500">{college.location}</Text>
        </View>
        {showTier && college.academicTier && (
          <View className={`rounded-full px-3 py-1 ${tier.bg}`}>
            <Text className={`text-xs font-bold ${tier.text}`}>{tier.label}</Text>
          </View>
        )}
      </View>

      <Text className="text-sm text-gray-500 mt-2 mb-3" numberOfLines={2}>
        {college.description}
      </Text>

      <View className="flex-row items-center justify-between">
        {college.fitScore !== undefined && (
          <View className="flex-row items-center">
            <View className="flex-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <View
                style={{
                  width: `${college.fitScore}%`,
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: '#1e3a5f',
                }}
              />
            </View>
            <Text className="text-xs text-gray-400 ml-2">{college.fitScore}% fit</Text>
          </View>
        )}
        <Text className="text-xs font-medium text-navy-700">
          {formatNetCost(college.estimatedNetCost)}
        </Text>
      </View>

      {college.admitRate && (
        <Text className="text-xs text-gray-400 mt-1">
          {college.admitRate}% admit rate · {college.type === 'public' ? 'Public' : 'Private'}
        </Text>
      )}
    </TouchableOpacity>
  );
}
