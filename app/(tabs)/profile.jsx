import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useAppStore from '../../src/store/useAppStore';
import { FIELDS } from '../../src/data/majors';
import { matchScholarships } from '../../src/engine/scholarshipMatcher';
import { matchColleges } from '../../src/engine/collegeMatcher';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, resetProfile, setMatchedScholarships, setMatchedColleges } = useAppStore();

  const selectedField = FIELDS.find(f => f.id === profile.selectedField);

  const handleResetProfile = () => {
    Alert.alert(
      'Reset Profile',
      'This will clear all your profile data and matches. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetProfile();
            router.replace('/onboarding/welcome');
          },
        },
      ]
    );
  };

  const handleUpdateProfile = () => {
    router.push('/onboarding/academic');
  };

  const handleRerunMatching = () => {
    const scholarships = matchScholarships(profile);
    const colleges = matchColleges(profile);
    setMatchedScholarships(scholarships);
    setMatchedColleges(colleges.all);
    Alert.alert('Done!', 'Your matches have been updated.');
  };

  const Section = ({ title, children }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <Text className="text-sm font-bold text-gray-900 mb-3">{title}</Text>
      {children}
    </View>
  );

  const Row = ({ label, value }) => (
    <View className="flex-row justify-between py-1.5 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{value || 'Not set'}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">My Profile</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Your information and settings</Text>
      </View>

      <ScrollView className="flex-1 px-6 mt-2" showsVerticalScrollIndicator={false}>
        {/* Profile header card */}
        <View className="bg-white rounded-3xl p-5 mb-3 items-center border border-gray-100">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#e8eef7' }}>
            <Text className="text-4xl">{selectedField?.emoji || '🎓'}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{profile.name || 'Your Name'}</Text>
          <Text className="text-sm text-gray-500">
            {profile.grade === 'junior' ? '11th Grade' : profile.grade === 'senior' ? '12th Grade' : 'High School'}
            {selectedField ? ` · ${selectedField.name}` : ''}
          </Text>
          <View className="flex-row gap-2 mt-3 flex-wrap justify-center">
            {profile.firstGen && <View className="bg-green-100 rounded-full px-3 py-1"><Text className="text-xs text-green-700 font-semibold">First-Gen</Text></View>}
            {profile.urm && <View className="bg-blue-100 rounded-full px-3 py-1"><Text className="text-xs text-blue-700 font-semibold">URM</Text></View>}
            {profile.interestedInHBCU && <View className="bg-purple-100 rounded-full px-3 py-1"><Text className="text-xs text-purple-700 font-semibold">HBCU Interest</Text></View>}
          </View>
        </View>

        {/* Academics */}
        <Section title="📚 Academics">
          <Row label="GPA (Unweighted)" value={profile.gpa ? `${profile.gpa}` : null} />
          <Row label="SAT" value={profile.sat ? `${profile.sat}` : null} />
          <Row label="ACT" value={profile.act ? `${profile.act}` : null} />
          <Row label="Class Rank" value={profile.classRank?.replace('_', ' ')} />
          <Row label="Course Rigor" value={profile.courseRigor?.replace('_', ' ')} />
        </Section>

        {/* Preferences */}
        <Section title="🗺️ College Preferences">
          <Row label="Regions" value={profile.locationPref?.join(', ')} />
          <Row label="Setting" value={profile.settingPref} />
          <Row label="Size" value={profile.sizePref?.replace('_', ' ')} />
          <Row label="Research Importance" value={profile.researchImportance ? `${profile.researchImportance}/10` : null} />
        </Section>

        {/* Financial */}
        <Section title="💰 Financial">
          <Row label="Family Contribution" value={profile.familyContribution !== null ? `$${profile.familyContribution?.toLocaleString()}/yr` : null} />
          <Row label="Household Income" value={profile.householdIncome ? `~$${profile.householdIncome?.toLocaleString()}` : null} />
          <Row label="Scholarship Priority" value={profile.scholarshipPriority} />
          <Row label="Loan Averse" value={profile.loanAverse ? 'Yes' : 'No'} />
        </Section>

        {/* Background */}
        <Section title="🌟 Background">
          <Row label="First-Generation" value={profile.firstGen ? 'Yes' : 'No'} />
          <Row label="Race / Ethnicity" value={profile.race?.replace('_', ' ')} />
          <Row label="Citizenship" value={profile.citizenship?.replace('_', ' ')} />
          <Row label="State" value={profile.state} />
          <Row label="HBCU Interest" value={profile.interestedInHBCU ? 'Yes' : 'No'} />
          <Row label="Service Hours" value={profile.serviceHours ? `~${profile.serviceHours}+` : null} />
          <Row label="Leadership Role" value={profile.hasLeadershipRole ? 'Yes' : 'No'} />
        </Section>

        {/* Actions */}
        <View className="gap-3 mb-4">
          <TouchableOpacity
            onPress={handleUpdateProfile}
            className="rounded-2xl py-4 items-center border-2"
            style={{ borderColor: '#1e3a5f' }}
          >
            <Text className="font-bold text-base" style={{ color: '#1e3a5f' }}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRerunMatching}
            className="rounded-2xl py-4 items-center bg-green-50 border-2 border-green-200"
          >
            <Text className="font-bold text-base text-green-700">Re-run Matching Engine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResetProfile}
            className="rounded-2xl py-4 items-center bg-red-50 border-2 border-red-200"
          >
            <Text className="font-bold text-base text-red-600">Reset All Data</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-4 items-center">
          <Text className="text-xs text-gray-400">ScholarCoach v1.0 · All data stored privately on your device</Text>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
