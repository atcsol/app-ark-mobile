import { Stack } from 'expo-router';
import { useHeaderOptions } from '@/hooks';
import { DrawerToggle } from '@/components/navigation/HeaderNav';

export default function BrandsLayout() {
  const screenOptions = useHeaderOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Marcas',
          headerLeft: () => <DrawerToggle />,
        }}
      />
      <Stack.Screen name="create" options={{ title: 'Nova Marca' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  );
}
