import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState } from '@/components/ui';
import { FormInput, FormSelect } from '@/components/forms';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { AdminUser, Role } from '@/types';

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role_ids: number[];
  is_active: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function UserEditScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role_ids: [],
    is_active: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [userResponse, rolesResponse] = await Promise.all([
        adminApi.getUser(uuid!),
        adminApi.getRolesAndPermissions(),
      ]);

      const u: AdminUser = (userResponse as any)?.data ?? userResponse;
      setUser(u);

      const rolesData = (rolesResponse as any)?.data ?? rolesResponse;
      const roles: Role[] = rolesData.roles || rolesData || [];
      setAvailableRoles(roles);

      const userRoleIds = u.roles?.map((r) => r.id) || [];
      const firstRoleId = userRoleIds.length > 0 ? String(userRoleIds[0]) : '';

      setForm({
        name: u.name,
        email: u.email,
        password: '',
        phone: (u as any).phone || '',
        role_ids: userRoleIds,
        is_active: (u as any).is_active !== false,
      });
      setSelectedRole(firstRoleId);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar usuario';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) {
      fetchData();
    }
  }, [fetchData, uuid]);

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Nome e obrigatorio';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Email e obrigatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      newErrors.email = 'Email invalido';
    }
    if (form.password && form.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleRoleChange = useCallback(
    (value: string) => {
      setSelectedRole(value);
      const roleId = parseInt(value, 10);
      if (!isNaN(roleId)) {
        updateField('role_ids', [roleId]);
      }
    },
    [updateField],
  );

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const data: Record<string, any> = {
        name: form.name.trim(),
        email: form.email.trim(),
        is_active: form.is_active,
      };

      if (form.password) {
        data.password = form.password;
      }
      if (form.phone.trim()) {
        data.phone = form.phone.trim();
      }
      if (form.role_ids.length > 0) {
        data.role_ids = form.role_ids;
      }

      await adminApi.updateUser(uuid!, data);
      Alert.alert('Sucesso', 'Usuario atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao atualizar usuario';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, uuid, router]);

  if (loading) {
    return <LoadingScreen message="Carregando usuario..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Usuario nao encontrado"
          description="O usuario solicitado nao existe."
        />
      </ScreenContainer>
    );
  }

  const roleOptions = availableRoles.map((role) => ({
    label: role.name,
    value: String(role.id),
  }));

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Editar Usuario</Text>
      <Text style={styles.screenSubtitle}>{user.name}</Text>

      <View style={styles.formContainer}>
        <FormInput
          label="Nome"
          required
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          error={errors.name}
          placeholder="Ex: Joao Silva"
        />

        <FormInput
          label="Email"
          required
          value={form.email}
          onChangeText={(text) => updateField('email', text)}
          error={errors.email}
          placeholder="Ex: joao@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormInput
          label="Senha"
          value={form.password}
          onChangeText={(text) => updateField('password', text)}
          error={errors.password}
          placeholder="Deixe em branco para manter a atual"
          secureTextEntry
        />

        <FormInput
          label="Telefone"
          value={form.phone}
          onChangeText={(text) => updateField('phone', text)}
          placeholder="Ex: (11) 99999-9999"
          keyboardType="phone-pad"
        />

        {roleOptions.length > 0 && (
          <FormSelect
            label="Papel"
            value={selectedRole}
            options={roleOptions}
            onValueChange={handleRoleChange}
            placeholder="Selecione um papel..."
          />
        )}

        <View style={styles.switchContainer}>
          <View style={styles.switchLabelContainer}>
            <Text style={styles.switchLabel}>Status</Text>
            <Text style={styles.switchDescription}>
              {form.is_active ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
          <Switch
            value={form.is_active}
            onValueChange={(value) => updateField('is_active', value)}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.white}
          />
        </View>

        <Button
          type="primary"
          style={styles.submitButton}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          Salvar Alteracoes
        </Button>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  screenTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  formContainer: {
    paddingBottom: spacing.xxl,
  },
  switchContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    ...caption.md,
    color: colors.textPrimary,
  },
  switchDescription: {
    ...body.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
