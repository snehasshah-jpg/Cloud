import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import useAppStore from '../../src/store/useAppStore';

const CLASS_RANKS = [
  { value: 'top5', label: 'Top 5%' },
  { value: 'top10', label: 'Top 10%' },
  { value: 'top25', label: 'Top 25%' },
  { value: 'top50', label: 'Top 50%' },
  { value: 'lower', label: 'Lower half' },
  { value: 'unranked', label: 'School doesn\'t rank' },
];

const COURSE_RIGORS = [
  { value: 'standard', label: 'Standard / Regular courses' },
  { value: 'honors', label: 'Mostly Honors courses' },
  { value: 'ap_ib', label: 'AP / IB courses' },
  { value: 'dual_enrollment', label: 'Dual enrollment / College courses' },
];

export default function AcademicScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAppStore();

  const [gpa, setGpa] = useState(profile.gpa?.toString() || '');
  const [sat, setSat] = useState(profile.sat?.toString() || '');
  const [act, setAct] = useState(profile.act?.toString() || '');
  const [classRank, setClassRank] = useState(profile.classRank || null);
  const [courseRigor, setCourseRigor] = useState(profile.courseRigor || null);
  const [name, setName] = useState(profile.name || '');
  const [grade, setGrade] = useState(profile.grade || null);

  const handleContinue = () => {
    updateProfile({
      name,
      grade,
      gpa: gpa ? parseFloat(gpa) : null,
      sat: sat ? parseInt(sat) : null,
      act: act ? parseInt(act) : null,
      classRank,
      courseRigor,
    });
    router.push('/onboarding/preferences');
  };

  const isValid = gpa !== '' && parseFloat(gpa) >= 0 && parseFloat(gpa) <= 4.0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-base font-medium" style={{ color: '#1e3a5f' }}>← Back</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-1">Your Academic Profile</Text>
          <Text className="text-base text-gray-500 mb-6 leading-relaxed">
            This helps us find scholarships and colleges where you're genuinely competitive.
          </Text>

          {/* Name */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">What's your name?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="First name"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-5"
            placeholderTextColor="#9ca3af"
          />

          {/* Grade */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">What grade are you in?</Text>
          <View className="flex-row gap-3 mb-5">
            {['junior', 'senior'].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGrade(g)}
                className="flex-1 py-3 rounded-xl border-2 items-center"
                style={grade === g ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ color: grade === g ? '#1e3a5f' : '#6b7280', fontWeight: grade === g ? '700' : '400' }}>
                  {g === 'junior' ? '11th Grade (Junior)' : '12th Grade (Senior)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* GPA */}
          <Text className="text-sm font-semibold text-gray-700 mb-1">Unweighted GPA (0.0 – 4.0) *</Text>
          <Text className="text-xs text-gray-400 mb-2">Use your unweighted GPA on a 4.0 scale.</Text>
          <TextInput
            value={gpa}
            onChangeText={setGpa}
            placeholder="e.g. 3.8"
            keyboardType="decimal-pad"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-5"
            placeholderTextColor="#9ca3af"
          />

          {/* SAT */}
          <Text className="text-sm font-semibold text-gray-700 mb-1">SAT Score (optional)</Text>
          <Text className="text-xs text-gray-400 mb-2">Total score out of 1600. Leave blank if not taken.</Text>
          <TextInput
            value={sat}
            onChangeText={setSat}
            placeholder="e.g. 1350"
            keyboardType="number-pad"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-5"
            placeholderTextColor="#9ca3af"
          />

          {/* ACT */}
          <Text className="text-sm font-semibold text-gray-700 mb-1">ACT Score (optional)</Text>
          <Text className="text-xs text-gray-400 mb-2">Total composite score out of 36. Leave blank if not taken.</Text>
          <TextInput
            value={act}
            onChangeText={setAct}
            placeholder="e.g. 28"
            keyboardType="number-pad"
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-5"
            placeholderTextColor="#9ca3af"
          />

          {/* Class rank */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Class Rank (optional)</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {CLASS_RANKS.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setClassRank(r.value)}
                className="px-3 py-2 rounded-xl border-2"
                style={classRank === r.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ fontSize: 13, color: classRank === r.value ? '#1e3a5f' : '#6b7280', fontWeight: classRank === r.value ? '600' : '400' }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Course rigor */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Highest level courses taken</Text>
          <View className="gap-2 mb-8">
            {COURSE_RIGORS.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setCourseRigor(r.value)}
                className="px-4 py-3 rounded-xl border-2"
                style={courseRigor === r.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ fontSize: 14, color: courseRigor === r.value ? '#1e3a5f' : '#374151', fontWeight: courseRigor === r.value ? '600' : '400' }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-8 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isValid}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: isValid ? '#1e3a5f' : '#d1d5db' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-lg">Continue →</Text>
        </TouchableOpacity>
        {!isValid && gpa !== '' && (
          <Text className="text-xs text-red-500 text-center mt-2">Please enter a valid GPA (0.0–4.0)</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
