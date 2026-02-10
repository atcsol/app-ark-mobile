import { Stack } from 'expo-router';
import { useHeaderOptions } from '@/hooks';
import { DrawerToggle } from '@/components/navigation/HeaderNav';

export default function CategoriesLayout() {
  const screenOptions = useHeaderOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Categorias',
          headerLeft: () => <DrawerToggle />,
        }}
      />
      <Stack.Screen name="create" options={{ title: 'Nova Categoria' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
    </Stack>
  );
}
