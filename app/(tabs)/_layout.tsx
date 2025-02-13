import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#007AFF',
      headerShown: false
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'New Game',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bullseye-arrow" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="history" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
