import { Stack } from 'expo-router';
import { useHeaderOptions } from '@/hooks';
import { DrawerToggle } from '@/components/navigation/HeaderNav';

export default function VehiclesLayout() {
  const screenOptions = useHeaderOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Veiculos',
          headerLeft: () => <DrawerToggle />,
        }}
      />
      <Stack.Screen name="[uuid]" options={{ title: 'Detalhes do Veiculo' }} />
      <Stack.Screen name="create" options={{ title: 'Novo Veiculo' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  );
}
