import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import useAppStore from '../../src/store/useAppStore';
import { calculateFieldRecommendations } from '../../src/engine/quizEngine';

export default function QuizResultsScreen() {
  const router = useRouter();
  const { quizAnswers, setRecommendedFields, updateProfile } = useAppStore();
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);

  useEffect(() => {
    const recommendations = calculateFieldRecommendations(quizAnswers);
    setFields(recommendations);
    setRecommendedFields(recommendations);
    if (recommendations.length > 0) {
      setSelectedField(recommendations[0].id);
    }
  }, []);

  const handleContinue = () => {
    updateProfile({ selectedField });
    router.push('/onboarding/academic');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-4">
          {/* Header */}
          <View className="items-center mb-6">
            <Text className="text-5xl mb-3">🎯</Text>
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              Your Top Fields
            </Text>
            <Text className="text-base text-gray-500 text-center leading-relaxed">
              Based on your answers, here are your best-fit fields of study. Tap one to set it as your primary focus.
            </Text>
          </View>

          {/* Field recommendations */}
          {fields.map((field, index) => (
            <TouchableOpacity
              key={field.id}
              onPress={() => setSelectedField(field.id)}
              className="rounded-2xl p-4 mb-3 border-2"
              style={selectedField === field.id
                ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' }
                : { borderColor: '#f3f4f6', backgroundColor: '#f9fafb' }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">{field.emoji}</Text>
                  <View>
                    <Text className="text-base font-semibold text-gray-900">{field.name}</Text>
                    {index === 0 && (
                      <Text className="text-xs font-bold" style={{ color: '#16a34a' }}>✓ Top Match</Text>
                    )}
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold" style={{ color: '#1e3a5f' }}>{field.confidence}%</Text>
                  <Text className="text-xs text-gray-400">match</Text>
                </View>
              </View>

              {/* Confidence bar */}
              <View className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <View
                  style={{
                    width: `${field.confidence}%`,
                    height: '100%',
                    borderRadius: 4,
                    backgroundColor: selectedField === field.id ? '#1e3a5f' : '#9fb9dc',
                  }}
                />
              </View>

              <Text className="text-sm text-gray-600 leading-relaxed mb-2">{field.description}</Text>

              <View className="flex-row flex-wrap gap-1">
                {field.careers.slice(0, 3).map((career) => (
                  <View key={career} className="bg-white rounded-full px-2 py-0.5 border border-gray-200">
                    <Text className="text-xs text-gray-500">{career}</Text>
                  </View>
                ))}
                <View className="bg-white rounded-full px-2 py-0.5 border border-gray-200">
                  <Text className="text-xs text-gray-500">{field.salary}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {fields.length === 0 && (
            <View className="items-center py-8">
              <Text className="text-4xl mb-3">🤔</Text>
              <Text className="text-gray-500 text-center">
                Not enough quiz answers to generate recommendations yet. You can continue and select your field manually.
              </Text>
            </View>
          )}

          <View className="h-4" />
        </View>
      </ScrollView>

      {/* Continue button */}
      <View className="px-6 pb-8 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: '#1e3a5f' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-lg">Continue with {selectedField ? fields.find(f => f.id === selectedField)?.name?.split(' ')[0] : 'My Choice'} →</Text>
        </TouchableOpacity>
        <Text className="text-xs text-gray-400 text-center mt-2">You can always change this later in your profile</Text>
      </View>
    </SafeAreaView>
  );
}
