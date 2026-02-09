import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';

function DrawerToggle() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ marginLeft: 8 }}>
      <Text style={{ fontSize: 24, color: colors.textPrimary }}>☰</Text>
    </TouchableOpacity>
  );
}

export default function ApprovalsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Aprovacoes',
          headerLeft: () => <DrawerToggle />,
        }}
      />
    </Stack>
  );
}
