import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import PlayersScreen from '../screens/Players/PlayersScreen';
import TeamsScreen from '../screens/Teams/TeamsScreen';
import TournamentsScreen from '../screens/Tournaments/TournamentsScreen';
import SponsorsScreen from '../screens/Sponsors/SponsorsScreen';
import TasksScreen from '../screens/Tasks/TasksScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { COLORS, FONTS } from '../utils/theme';

const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, focused }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  </View>
);

export default function AppNavigator({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.cardBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: FONTS.xs, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      >
        {(props) => <DashboardScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Players"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎮" focused={focused} /> }}
        component={PlayersScreen}
      />
      <Tab.Screen
        name="Teams"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} /> }}
        component={TeamsScreen}
      />
      <Tab.Screen
        name="Tournaments"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚔️" focused={focused} /> }}
        component={TournamentsScreen}
      />
      <Tab.Screen
        name="Sponsors"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💼" focused={focused} /> }}
        component={SponsorsScreen}
      />
      <Tab.Screen
        name="Tasks"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✅" focused={focused} /> }}
        component={TasksScreen}
      />
      <Tab.Screen
        name="Profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      >
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
