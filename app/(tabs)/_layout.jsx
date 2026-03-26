import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

function TabIcon({ icon, label, focused }) {
  return (
    <View className="items-center justify-center pt-1">
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#1e3a5f' : '#9ca3af', fontWeight: focused ? '700' : '400', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 12,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="colleges"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏛️" label="Colleges" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scholarships"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Aid" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🧠" label="Coach" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
