import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#333',
          // Eleva la barra de pestañas según el espacio seguro de Android/iOS
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Héroe',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Mapa Radar',
        }}
      />
    </Tabs>
  );
}