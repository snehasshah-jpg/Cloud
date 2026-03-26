import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import useAppStore from '../../src/store/useAppStore';
import { matchScholarships } from '../../src/engine/scholarshipMatcher';
import { matchColleges } from '../../src/engine/collegeMatcher';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const RACES = [
  { value: 'hispanic', label: 'Hispanic / Latino' },
  { value: 'black', label: 'Black / African American' },
  { value: 'native_american', label: 'Native American / Alaska Native' },
  { value: 'asian_pi', label: 'Asian / Pacific Islander' },
  { value: 'white', label: 'White / Non-Hispanic' },
  { value: 'two_or_more', label: 'Two or More Races' },
  { value: 'prefer_not', label: 'Prefer Not to Say' },
];

const URM_RACES = ['hispanic', 'black', 'native_american'];

const CITIZENSHIPS = [
  { value: 'us_citizen', label: 'U.S. Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident (Green Card)' },
  { value: 'daca', label: 'DACA Recipient' },
  { value: 'international', label: 'International Student' },
];

export default function CircumstancesScreen() {
  const router = useRouter();
  const { profile, updateProfile, setMatchedScholarships, setMatchedColleges, completeOnboarding } = useAppStore();

  const [firstGen, setFirstGen] = useState(profile.firstGen || false);
  const [race, setRace] = useState(profile.race || null);
  const [gender, setGender] = useState(profile.gender || 'prefer_not');
  const [citizenship, setCitizenship] = useState(profile.citizenship || 'us_citizen');
  const [state, setState] = useState(profile.state || null);
  const [isAthlete, setIsAthlete] = useState(profile.isAthlete || false);
  const [interestedInHBCU, setInterestedInHBCU] = useState(profile.interestedInHBCU || false);
  const [serviceHours, setServiceHours] = useState(profile.serviceHours || 0);
  const [hasLeadershipRole, setHasLeadershipRole] = useState(profile.hasLeadershipRole || false);
  const [showStates, setShowStates] = useState(false);

  const handleFinish = () => {
    const isURM = URM_RACES.includes(race);
    const updatedProfile = {
      ...profile,
      firstGen,
      race,
      urm: isURM,
      gender,
      citizenship,
      state,
      isAthlete,
      interestedInHBCU,
      serviceHours,
      hasLeadershipRole,
      onboardingComplete: true,
    };

    updateProfile(updatedProfile);
    completeOnboarding();

    // Run matching engines
    const scholarshipMatches = matchScholarships(updatedProfile);
    const collegeMatches = matchColleges(updatedProfile);

    setMatchedScholarships(scholarshipMatches);
    setMatchedColleges(collegeMatches.all);

    router.replace('/(tabs)/dashboard');
  };

  const ServiceHourSelector = () => (
    <View className="flex-row gap-2 flex-wrap">
      {[0, 25, 50, 100, 200, 300].map((h) => (
        <TouchableOpacity
          key={h}
          onPress={() => setServiceHours(h)}
          className="px-3 py-2 rounded-xl border-2"
          style={serviceHours === h ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
        >
          <Text style={{ fontSize: 13, color: serviceHours === h ? '#1e3a5f' : '#6b7280', fontWeight: serviceHours === h ? '600' : '400' }}>
            {h === 0 ? '< 25 hrs' : `${h}+ hrs`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-base font-medium" style={{ color: '#1e3a5f' }}>← Back</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-1">Your Background</Text>
          <Text className="text-base text-gray-500 mb-2 leading-relaxed">
            This unlocks scholarships specifically designed for students like you.
          </Text>
          <View className="bg-green-50 rounded-xl p-3 mb-6">
            <Text className="text-sm text-green-700 leading-relaxed">
              ✨ Your unique background opens doors that others don't have. Let's find those scholarships.
            </Text>
          </View>

          {/* First gen */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Are you a first-generation college student?
          </Text>
          <Text className="text-xs text-gray-400 mb-2">Neither parent completed a 4-year college degree.</Text>
          <View className="flex-row gap-3 mb-5">
            {[{ v: true, l: 'Yes — I\'m first-gen' }, { v: false, l: 'No' }].map(({ v, l }) => (
              <TouchableOpacity key={String(v)} onPress={() => setFirstGen(v)}
                className="flex-1 py-3 rounded-xl border-2 items-center"
                style={firstGen === v ? { borderColor: '#16a34a', backgroundColor: '#f0fdf4' } : { borderColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 13, color: firstGen === v ? '#16a34a' : '#6b7280', fontWeight: firstGen === v ? '700' : '400', textAlign: 'center' }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Race / Ethnicity */}
          <Text className="text-sm font-semibold text-gray-700 mb-1">Race / Ethnicity</Text>
          <Text className="text-xs text-gray-400 mb-2">Many scholarships target specific groups. This helps us match you accurately.</Text>
          <View className="gap-2 mb-5">
            {RACES.map((r) => (
              <TouchableOpacity key={r.value} onPress={() => setRace(r.value)}
                className="flex-row items-center px-4 py-3 rounded-xl border-2"
                style={race === r.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}>
                <Text style={{ flex: 1, fontSize: 14, color: race === r.value ? '#1e3a5f' : '#374151', fontWeight: race === r.value ? '600' : '400' }}>{r.label}</Text>
                {race === r.value && <Text style={{ color: '#1e3a5f' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Gender */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Gender</Text>
          <View className="flex-row gap-2 flex-wrap mb-5">
            {[
              { v: 'female', l: 'Female' },
              { v: 'male', l: 'Male' },
              { v: 'non_binary', l: 'Non-binary' },
              { v: 'prefer_not', l: 'Prefer not to say' },
            ].map(({ v, l }) => (
              <TouchableOpacity key={v} onPress={() => setGender(v)}
                className="px-3 py-2 rounded-xl border-2"
                style={gender === v ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 13, color: gender === v ? '#1e3a5f' : '#6b7280', fontWeight: gender === v ? '600' : '400' }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Citizenship */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Citizenship Status</Text>
          <View className="gap-2 mb-5">
            {CITIZENSHIPS.map((c) => (
              <TouchableOpacity key={c.value} onPress={() => setCitizenship(c.value)}
                className="px-4 py-3 rounded-xl border-2"
                style={citizenship === c.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 14, color: citizenship === c.value ? '#1e3a5f' : '#374151', fontWeight: citizenship === c.value ? '600' : '400' }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* State */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">State of Residence</Text>
          <TouchableOpacity
            onPress={() => setShowStates(!showStates)}
            className="px-4 py-3 rounded-xl border-2 flex-row justify-between items-center mb-2"
            style={{ borderColor: state ? '#1e3a5f' : '#e5e7eb', backgroundColor: state ? '#e8eef7' : 'white' }}>
            <Text style={{ color: state ? '#1e3a5f' : '#9ca3af', fontSize: 14, fontWeight: state ? '600' : '400' }}>
              {state || 'Select your state →'}
            </Text>
          </TouchableOpacity>
          {showStates && (
            <View className="flex-row flex-wrap gap-1 mb-5 bg-gray-50 rounded-xl p-3">
              {US_STATES.map((s) => (
                <TouchableOpacity key={s} onPress={() => { setState(s); setShowStates(false); }}
                  className="px-2 py-1 rounded-lg border"
                  style={{ borderColor: state === s ? '#1e3a5f' : '#d1d5db', backgroundColor: state === s ? '#e8eef7' : 'white' }}>
                  <Text style={{ fontSize: 12, color: state === s ? '#1e3a5f' : '#374151' }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* HBCU interest */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Are you interested in attending an HBCU?</Text>
          <View className="flex-row gap-3 mb-5">
            {[{ v: true, l: 'Yes, definitely considering it' }, { v: false, l: 'Not primarily' }].map(({ v, l }) => (
              <TouchableOpacity key={String(v)} onPress={() => setInterestedInHBCU(v)}
                className="flex-1 py-3 rounded-xl border-2 items-center"
                style={interestedInHBCU === v ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 12, color: interestedInHBCU === v ? '#1e3a5f' : '#6b7280', fontWeight: interestedInHBCU === v ? '700' : '400', textAlign: 'center' }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Service hours */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Community service hours (approx.)</Text>
          <ServiceHourSelector />
          <View className="mb-5" />

          {/* Leadership */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Do you hold or have you held a leadership role? (student gov, club president, team captain, etc.)
          </Text>
          <View className="flex-row gap-3 mb-8">
            {[{ v: true, l: 'Yes' }, { v: false, l: 'Not really' }].map(({ v, l }) => (
              <TouchableOpacity key={String(v)} onPress={() => setHasLeadershipRole(v)}
                className="flex-1 py-3 rounded-xl border-2 items-center"
                style={hasLeadershipRole === v ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 14, color: hasLeadershipRole === v ? '#1e3a5f' : '#6b7280', fontWeight: hasLeadershipRole === v ? '700' : '400' }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-8 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleFinish}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: '#1e3a5f' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-lg">See My Matches 🎓</Text>
        </TouchableOpacity>
        <Text className="text-xs text-gray-400 text-center mt-2">We'll run the matching algorithm now</Text>
      </View>
    </SafeAreaView>
  );
}
