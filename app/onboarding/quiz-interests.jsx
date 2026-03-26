import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import useAppStore from '../../src/store/useAppStore';
import { QUIZ_QUESTIONS } from '../../src/data/majors';
import ProgressBar from '../../components/ProgressBar';

export default function QuizInterestsScreen() {
  const router = useRouter();
  const { quizAnswers, setQuizAnswer } = useAppStore();
  const questions = QUIZ_QUESTIONS.interests;
  const [currentQ, setCurrentQ] = useState(0);

  const question = questions[currentQ];

  const handleSelect = (optionIndex) => {
    setQuizAnswer(question.id, optionIndex);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      router.push('/onboarding/quiz-learning');
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={handleBack}>
            <Text className="text-base font-medium" style={{ color: '#1e3a5f' }}>← Back</Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm">Section 3 of 4</Text>
        </View>

        <ProgressBar
          current={currentQ + 1}
          total={questions.length}
          label="Interests & Values"
        />

        <View className="mt-6 mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: '#2e5d99' }}>
            🌍 What matters to you?
          </Text>
          <Text className="text-xl font-bold text-gray-900 leading-tight">
            {question.text}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {question.options.map((option, index) => {
          const isSelected = quizAnswers[question.id] === index;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelect(index)}
              className="rounded-2xl p-4 mb-3 border-2"
              style={isSelected
                ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' }
                : { borderColor: '#f3f4f6', backgroundColor: '#f9fafb' }}
              activeOpacity={0.7}
            >
              <Text className="text-base leading-relaxed"
                style={{ color: isSelected ? '#162c4a' : '#374151', fontWeight: isSelected ? '600' : '400' }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
