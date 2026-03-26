import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import useAppStore from '../../src/store/useAppStore';

const REGIONS = [
  { value: 'northeast', label: '🗽 Northeast', sub: 'NY, MA, PA, CT, MD...' },
  { value: 'southeast', label: '🌴 Southeast', sub: 'NC, GA, FL, VA, TN...' },
  { value: 'midwest', label: '🌽 Midwest', sub: 'IL, MI, OH, MN...' },
  { value: 'southwest', label: '🌵 Southwest', sub: 'TX, AZ, CO...' },
  { value: 'west', label: '🌊 West', sub: 'CA, WA, OR...' },
];

const SETTINGS = [
  { value: 'urban', label: '🏙️ Urban', sub: 'Big city campus' },
  { value: 'suburban', label: '🏘️ Suburban', sub: 'College town' },
  { value: 'rural', label: '🌳 Rural', sub: 'Quiet campus' },
];

const SIZES = [
  { value: 'small', label: 'Small', sub: '< 3,000 students' },
  { value: 'medium', label: 'Medium', sub: '3,000–10,000' },
  { value: 'large', label: 'Large', sub: '10,000–20,000' },
  { value: 'very_large', label: 'Very Large', sub: '20,000+' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAppStore();

  const [regions, setRegions] = useState(profile.locationPref || []);
  const [setting, setSetting] = useState(profile.settingPref || null);
  const [size, setSize] = useState(profile.sizePref || null);
  const [research, setResearch] = useState(profile.researchImportance || 5);
  const [coop, setCoop] = useState(profile.coopImportance || 5);

  const toggleRegion = (val) => {
    setRegions((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  };

  const handleContinue = () => {
    updateProfile({
      locationPref: regions.length > 0 ? regions : ['any'],
      settingPref: setting || 'any',
      sizePref: size || 'any',
      researchImportance: research,
      coopImportance: coop,
    });
    router.push('/onboarding/financial');
  };

  const ScaleSelector = ({ value, onChange, lowLabel, highLabel }) => (
    <View>
      <View className="flex-row gap-2 mb-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            className="flex-1 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: n <= value ? '#1e3a5f' : '#e5e7eb' }}
          >
            <Text style={{ fontSize: 11, color: n <= value ? 'white' : '#6b7280', fontWeight: '600' }}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-400">{lowLabel}</Text>
        <Text className="text-xs text-gray-400">{highLabel}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-base font-medium" style={{ color: '#1e3a5f' }}>← Back</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-1">College Preferences</Text>
          <Text className="text-base text-gray-500 mb-6 leading-relaxed">
            Where do you want to go? What's your ideal campus?
          </Text>

          {/* Region */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Preferred Region(s) <Text className="text-gray-400 font-normal">(select all that apply)</Text>
          </Text>
          <View className="gap-2 mb-5">
            {REGIONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => toggleRegion(r.value)}
                className="flex-row items-center px-4 py-3 rounded-xl border-2"
                style={regions.includes(r.value) ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <View className="flex-1">
                  <Text style={{ fontSize: 14, color: regions.includes(r.value) ? '#1e3a5f' : '#374151', fontWeight: regions.includes(r.value) ? '600' : '400' }}>
                    {r.label}
                  </Text>
                  <Text className="text-xs text-gray-400">{r.sub}</Text>
                </View>
                {regions.includes(r.value) && <Text style={{ color: '#1e3a5f' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Setting */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">Campus Setting</Text>
          <View className="flex-row gap-2 mb-5">
            {SETTINGS.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => setSetting(s.value)}
                className="flex-1 py-3 px-2 rounded-xl border-2 items-center"
                style={setting === s.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ fontSize: 15 }}>{s.label.split(' ')[0]}</Text>
                <Text style={{ fontSize: 12, color: setting === s.value ? '#1e3a5f' : '#374151', fontWeight: setting === s.value ? '700' : '400', marginTop: 2 }}>
                  {s.label.split(' ')[1]}
                </Text>
                <Text className="text-xs text-gray-400 text-center">{s.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Size */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">School Size</Text>
          <View className="flex-row gap-2 mb-5">
            {SIZES.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => setSize(s.value)}
                className="flex-1 py-3 px-1 rounded-xl border-2 items-center"
                style={size === s.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ fontSize: 12, color: size === s.value ? '#1e3a5f' : '#374151', fontWeight: size === s.value ? '700' : '400', textAlign: 'center' }}>
                  {s.label}
                </Text>
                <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>{s.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Research importance */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Research opportunities — how important? <Text className="font-bold" style={{ color: '#1e3a5f' }}>{research}/10</Text>
          </Text>
          <ScaleSelector value={research} onChange={setResearch} lowLabel="Not important" highLabel="Essential" />
          <View className="mb-5" />

          {/* Co-op importance */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Co-op / internship program — how important? <Text className="font-bold" style={{ color: '#1e3a5f' }}>{coop}/10</Text>
          </Text>
          <ScaleSelector value={coop} onChange={setCoop} lowLabel="Not important" highLabel="Essential" />

          <View className="h-8" />
        </View>
      </ScrollView>

      <View className="px-6 pb-8 pt-4 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: '#1e3a5f' }}
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-lg">Continue →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
