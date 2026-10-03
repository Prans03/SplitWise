// ============================================================
// RootNavigator – fixes white-screen flash during transitions
// by setting contentStyle background from the live theme
// ============================================================
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { RootStackParamList } from '../types';

import HomeScreen       from '../screens/HomeScreen';
import ActivityScreen   from '../screens/ActivityScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import SettlementScreen from '../screens/SettlementScreen';
import AddGroupScreen   from '../screens/AddGroupScreen';
import SettingsScreen   from '../screens/SettingsScreen';
import AccountScreen    from '../screens/AccountScreen';
import GroupInviteScreen from '../screens/GroupInviteScreen';
import ScanScreen       from '../screens/ScanScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const t = useTheme();
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'default',
        gestureEnabled: true,
        // ▼ This is the key fix – prevents the white flash
        contentStyle: { backgroundColor: t.background },
      }}
    >
      <Stack.Screen name="Home"        component={HomeScreen} />
      <Stack.Screen name="Activity"    component={ActivityScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: t.background } }}
      />
      <Stack.Screen
        name="Settlement"
        component={SettlementScreen}
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: t.background } }}
      />
      <Stack.Screen
        name="AddGroup"
        component={AddGroupScreen}
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: t.background } }}
      />
      <Stack.Screen name="Settings"    component={SettingsScreen} />
      <Stack.Screen name="Account"     component={AccountScreen} />
      <Stack.Screen
        name="GroupInvite"
        component={GroupInviteScreen}
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: t.background } }}
      />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: '#000000' } }}
      />
      <Stack.Screen
        name="BudgetConfig"
        component={require('../screens/BudgetConfigScreen').default}
        options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: t.background } }}
      />
      <Stack.Screen
        name="BudgetCalendar"
        component={require('../screens/BudgetCalendarScreen').default}
        options={{ animation: 'fade_from_bottom', contentStyle: { backgroundColor: t.background } }}
      />
    </Stack.Navigator>
  );
}
