import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen } from '@/components/ui';
import { FormInput, FormSelect } from '@/components/forms';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Role } from '@/types';

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

export default function UserCreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

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

  const fetchRoles = useCallback(async () => {
    try {
      const response = await adminApi.getRolesAndPermissions();
      const data = (response as any)?.data ?? response;
      const roles: Role[] = data.roles || data || [];
      setAvailableRoles(roles);
    } catch (err: any) {
      Alert.alert('Aviso', 'Nao foi possivel carregar os papeis disponiveis.');
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

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
    if (!form.password.trim()) {
      newErrors.password = 'Senha e obrigatoria';
    } else if (form.password.length < 8) {
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
        password: form.password,
        is_active: form.is_active,
      };

      if (form.phone.trim()) {
        data.phone = form.phone.trim();
      }
      if (form.role_ids.length > 0) {
        data.role_ids = form.role_ids;
      }

      await adminApi.createUser(data);
      Alert.alert('Sucesso', 'Usuario cadastrado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao cadastrar usuario';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, router]);

  if (loadingRoles) {
    return <LoadingScreen message="Carregando..." />;
  }

  const roleOptions = availableRoles.map((role) => ({
    label: role.name,
    value: String(role.id),
  }));

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Novo Usuario</Text>
      <Text style={styles.screenSubtitle}>Preencha os dados para cadastrar um usuario</Text>

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
          required
          value={form.password}
          onChangeText={(text) => updateField('password', text)}
          error={errors.password}
          placeholder="Minimo 8 caracteres"
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
          Cadastrar Usuario
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
