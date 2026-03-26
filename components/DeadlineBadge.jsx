import { View, Text } from 'react-native';
import { format, parseISO } from 'date-fns';

export default function DeadlineBadge({ deadline, daysUntil, compact = false }) {
  const days = daysUntil ?? (() => {
    try {
      const diff = Math.ceil((parseISO(deadline) - new Date()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  })();

  if (days === null) return null;

  let bg, text, label;
  if (days < 0) {
    bg = 'bg-gray-100'; text = 'text-gray-500'; label = 'Past';
  } else if (days <= 7) {
    bg = 'bg-red-100'; text = 'text-red-700'; label = days === 0 ? 'Today!' : `${days}d left`;
  } else if (days <= 30) {
    bg = 'bg-yellow-100'; text = 'text-yellow-700'; label = `${days}d left`;
  } else {
    bg = 'bg-green-100'; text = 'text-green-700';
    try {
      label = format(parseISO(deadline), 'MMM d');
    } catch {
      label = `${days}d`;
    }
  }

  if (compact) {
    return (
      <View className={`rounded px-1.5 py-0.5 ${bg}`}>
        <Text className={`text-xs font-medium ${text}`}>{label}</Text>
      </View>
    );
  }

  return (
    <View className={`rounded-lg px-2 py-1 ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>
        {days <= 30 ? `⏰ ${label}` : `📅 Due ${label}`}
      </Text>
    </View>
  );
}
