import { Stack } from 'expo-router';
import { useHeaderOptions } from '@/hooks';
import { BackButton } from '@/components/navigation/HeaderNav';

export default function ServiceEditLayout() {
  const screenOptions = useHeaderOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="[uuid]"
        options={{
          title: 'Editar Servico',
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
