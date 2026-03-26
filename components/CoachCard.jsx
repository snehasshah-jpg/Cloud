import { View, Text, TouchableOpacity } from 'react-native';

const TYPE_STYLES = {
  opportunity: { border: '#16a34a', bg: '#f0fdf4', icon: '✨' },
  strength: { border: '#2563eb', bg: '#eff6ff', icon: '💪' },
  honest: { border: '#d97706', bg: '#fffbeb', icon: '🎯' },
  urgent: { border: '#dc2626', bg: '#fef2f2', icon: '⏰' },
  strategy: { border: '#7c3aed', bg: '#faf5ff', icon: '🧠' },
  action: { border: '#1e3a5f', bg: '#eff6ff', icon: '📋' },
  info: { border: '#6b7280', bg: '#f9fafb', icon: 'ℹ️' },
};

export default function CoachCard({ message, onAction }) {
  const style = TYPE_STYLES[message.type] || TYPE_STYLES.info;

  return (
    <View
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: style.bg,
        borderLeftWidth: 4,
        borderLeftColor: style.border,
      }}
    >
      <View className="flex-row items-start gap-2 mb-2">
        <Text className="text-lg">{style.icon}</Text>
        <Text className="text-sm font-bold text-gray-900 flex-1">{message.title}</Text>
      </View>
      <Text className="text-sm text-gray-700 leading-relaxed">{message.body}</Text>
      {message.action && onAction && (
        <TouchableOpacity
          onPress={() => onAction(message)}
          className="mt-3 self-start"
        >
          <Text className="text-sm font-semibold" style={{ color: style.border }}>
            {message.action} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
