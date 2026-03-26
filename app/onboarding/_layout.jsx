import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="quiz-passion" />
      <Stack.Screen name="quiz-strengths" />
      <Stack.Screen name="quiz-interests" />
      <Stack.Screen name="quiz-learning" />
      <Stack.Screen name="quiz-results" />
      <Stack.Screen name="academic" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="financial" />
      <Stack.Screen name="circumstances" />
    </Stack>
  );
}
