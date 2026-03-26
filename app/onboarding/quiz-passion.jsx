import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import useAppStore from '../../src/store/useAppStore';
import { QUIZ_QUESTIONS } from '../../src/data/majors';
import ProgressBar from '../../components/ProgressBar';

export default function QuizPassionScreen() {
  const router = useRouter();
  const { quizAnswers, setQuizAnswer } = useAppStore();
  const questions = QUIZ_QUESTIONS.passion;
  const [currentQ, setCurrentQ] = useState(0);

  const question = questions[currentQ];
  const totalSteps = 4; // 4 quiz sections

  const handleSelect = (optionIndex) => {
    setQuizAnswer(question.id, optionIndex);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      router.push('/onboarding/quiz-strengths');
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
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={handleBack}>
            <Text className="text-navy-700 font-medium text-base" style={{ color: '#1e3a5f' }}>← Back</Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm">Section 1 of 4</Text>
        </View>

        <ProgressBar
          current={currentQ + 1}
          total={questions.length}
          label="Passion Exploration"
        />

        <View className="mt-6 mb-4">
          <Text className="text-sm font-semibold text-navy-600 mb-2" style={{ color: '#2e5d99' }}>
            ✨ What drives you?
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
              className={`rounded-2xl p-4 mb-3 border-2 ${
                isSelected
                  ? 'border-navy-700 bg-navy-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
              style={isSelected ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : {}}
              activeOpacity={0.7}
            >
              <Text className={`text-base leading-relaxed ${isSelected ? 'font-semibold text-navy-800' : 'text-gray-700'}`}
                style={isSelected ? { color: '#162c4a' } : {}}>
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
