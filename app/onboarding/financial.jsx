import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import useAppStore from '../../src/store/useAppStore';

const CONTRIBUTIONS = [
  { value: 0, label: '$0', sub: 'Family cannot contribute' },
  { value: 10000, label: '~$10K/yr', sub: '' },
  { value: 20000, label: '~$20K/yr', sub: '' },
  { value: 40000, label: '~$40K/yr', sub: '' },
  { value: 60000, label: '~$60K/yr', sub: '' },
  { value: 80000, label: '$80K+/yr', sub: 'Family can pay full price' },
];

const PRIORITIES = [
  { value: 'critical', label: '🚨 Critical', sub: 'I need major aid to afford college' },
  { value: 'important', label: '⚠️ Important', sub: 'Aid would significantly help' },
  { value: 'nice_to_have', label: '✓ Nice to have', sub: 'Family can manage, but more is better' },
];

const INCOME_RANGES = [
  { value: 25000, label: 'Under $25K' },
  { value: 40000, label: '$25K–$55K' },
  { value: 65000, label: '$55K–$75K' },
  { value: 95000, label: '$75K–$120K' },
  { value: 150000, label: '$120K+' },
];

export default function FinancialScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAppStore();

  const [contribution, setContribution] = useState(profile.familyContribution ?? null);
  const [priority, setPriority] = useState(profile.scholarshipPriority || null);
  const [loanAverse, setLoanAverse] = useState(profile.loanAverse || false);
  const [income, setIncome] = useState(profile.householdIncome || null);

  const handleContinue = () => {
    updateProfile({
      familyContribution: contribution,
      scholarshipPriority: priority || 'important',
      loanAverse,
      householdIncome: income,
    });
    router.push('/onboarding/circumstances');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-base font-medium" style={{ color: '#1e3a5f' }}>← Back</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-1">Financial Reality</Text>
          <Text className="text-base text-gray-500 mb-2 leading-relaxed">
            This is private — we use it only to find scholarships and colleges that actually work for your situation.
          </Text>
          <View className="bg-blue-50 rounded-xl p-3 mb-6">
            <Text className="text-sm text-blue-700 leading-relaxed">
              💡 Being honest here means better matches. We'll never judge. We'll just find the best path.
            </Text>
          </View>

          {/* Family contribution */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            How much can your family realistically contribute per year?
          </Text>
          <View className="gap-2 mb-5">
            {CONTRIBUTIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setContribution(c.value)}
                className="flex-row items-center px-4 py-3 rounded-xl border-2"
                style={contribution === c.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ flex: 1, fontSize: 14, color: contribution === c.value ? '#1e3a5f' : '#374151', fontWeight: contribution === c.value ? '700' : '400' }}>
                  {c.label} {c.sub ? `— ${c.sub}` : ''}
                </Text>
                {contribution === c.value && <Text style={{ color: '#1e3a5f' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Household income */}
          <Text className="text-sm font-semibold text-gray-700 mb-1">Approximate household income</Text>
          <Text className="text-xs text-gray-400 mb-2">Used to match need-based scholarships.</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {INCOME_RANGES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setIncome(r.value)}
                className="px-3 py-2 rounded-xl border-2"
                style={income === r.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ fontSize: 13, color: income === r.value ? '#1e3a5f' : '#6b7280', fontWeight: income === r.value ? '600' : '400' }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Scholarship priority */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">How important is financial aid?</Text>
          <View className="gap-2 mb-5">
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPriority(p.value)}
                className="px-4 py-3 rounded-xl border-2"
                style={priority === p.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ fontSize: 14, color: priority === p.value ? '#1e3a5f' : '#374151', fontWeight: priority === p.value ? '700' : '400' }}>
                  {p.label}
                </Text>
                <Text className="text-xs text-gray-400">{p.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Loan averse */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Do you want to avoid student loans as much as possible?
          </Text>
          <View className="flex-row gap-3 mb-8">
            {[{ value: true, label: 'Yes — minimize loans' }, { value: false, label: 'Loans are OK' }].map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                onPress={() => setLoanAverse(opt.value)}
                className="flex-1 py-3 rounded-xl border-2 items-center"
                style={loanAverse === opt.value ? { borderColor: '#1e3a5f', backgroundColor: '#e8eef7' } : { borderColor: '#e5e7eb' }}
              >
                <Text style={{ fontSize: 13, color: loanAverse === opt.value ? '#1e3a5f' : '#6b7280', fontWeight: loanAverse === opt.value ? '700' : '400', textAlign: 'center' }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
