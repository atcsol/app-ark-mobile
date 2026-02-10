import { Stack } from 'expo-router';
import { useHeaderOptions } from '@/hooks';
import { DrawerToggle } from '@/components/navigation/HeaderNav';

export default function SellersLayout() {
  const screenOptions = useHeaderOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Vendedores',
          headerLeft: () => <DrawerToggle />,
        }}
      />
      <Stack.Screen name="[uuid]" options={{ title: 'Detalhes do Vendedor' }} />
      <Stack.Screen name="create" options={{ title: 'Novo Vendedor' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  );
}
