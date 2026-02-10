import { Stack } from 'expo-router';
import { useHeaderOptions } from '@/hooks';
import { DrawerToggle } from '@/components/navigation/HeaderNav';

export default function InvestorsLayout() {
  const screenOptions = useHeaderOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Investidores',
          headerLeft: () => <DrawerToggle />,
        }}
      />
      <Stack.Screen name="[uuid]" options={{ title: 'Detalhes do Investidor' }} />
      <Stack.Screen name="create" options={{ title: 'Novo Investidor' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  );
}
