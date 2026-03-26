import { View, Text } from 'react-native';

export default function ProgressBar({ current, total, label }) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <View className="w-full">
      {label && (
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-gray-500">{label}</Text>
          <Text className="text-xs text-gray-500">{current}/{total}</Text>
        </View>
      )}
      <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: '#1e3a5f' }}
        />
      </View>
    </View>
  );
}
