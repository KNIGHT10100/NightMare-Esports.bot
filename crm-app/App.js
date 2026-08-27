import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/Auth/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { getUser, seedDemoData } from './src/store/dataStore';
import { COLORS } from './src/utils/theme';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await seedDemoData();
      const savedUser = await getUser();
      if (savedUser) setUser(savedUser);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: COLORS.primary,
            background: COLORS.background,
            card: COLORS.surface,
            text: COLORS.text,
            border: COLORS.cardBorder,
            notification: COLORS.accent,
          },
        }}
      >
        {user
          ? <AppNavigator user={user} onLogout={() => setUser(null)} />
          : <LoginScreen onLogin={setUser} />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
