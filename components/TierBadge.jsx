import { View, Text } from 'react-native';

const TIER_CONFIG = {
  green: { label: 'GREEN — Apply Now', bg: 'bg-green-100', text: 'text-green-800', dot: '#16a34a' },
  yellow: { label: 'YELLOW — Worth Trying', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: '#d97706' },
  blue: { label: 'BLUE — Long Shot', bg: 'bg-blue-100', text: 'text-blue-800', dot: '#2563eb' },
  gray: { label: 'GRAY — Skip It', bg: 'bg-gray-100', text: 'text-gray-600', dot: '#6b7280' },
};

export default function TierBadge({ tier, compact = false }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.gray;

  if (compact) {
    return (
      <View className={`rounded-full px-2 py-0.5 ${config.bg}`}>
        <Text className={`text-xs font-semibold ${config.text}`}>{tier.toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <View className={`rounded-full px-3 py-1 flex-row items-center gap-1.5 self-start ${config.bg}`}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: config.dot }}
      />
      <Text className={`text-xs font-bold ${config.text}`}>{config.label}</Text>
    </View>
  );
}
