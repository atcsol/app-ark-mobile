import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState } from '@/components/ui';
import { FormInput } from '@/components/forms/FormInput';
import { FormCurrency } from '@/components/forms/FormCurrency';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface ServiceCatalog {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  base_price: number;
  category?: string;
}

interface ServiceForm {
  name: string;
  description: string;
  category: string;
  base_price: number;
}

interface FormErrors {
  name?: string;
  base_price?: string;
}

export default function ServiceEditScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [service, setService] = useState<ServiceCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ServiceForm>({
    name: '',
    description: '',
    category: '',
    base_price: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchService = useCallback(async () => {
    try {
      setError(null);
      const data = await adminApi.getService(uuid!);
      setService(data);
      setForm({
        name: data.name,
        description: data.description || '',
        category: data.category || '',
        base_price: data.base_price,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar servico';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) fetchService();
  }, [fetchService, uuid]);

  const updateField = useCallback(
    <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Nome e obrigatorio';
    if (!form.base_price || form.base_price <= 0) newErrors.base_price = 'Preco base e obrigatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const data: Record<string, any> = {
        name: form.name.trim(),
        base_price: form.base_price,
      };
      if (form.description.trim()) data.description = form.description.trim();
      if (form.category.trim()) data.category = form.category.trim();

      await adminApi.updateService(uuid!, data);
      Alert.alert('Sucesso', 'Servico atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao atualizar servico';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, uuid, router]);

  if (loading) {
    return <LoadingScreen message="Carregando servico..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!service) {
    return (
      <ScreenContainer>
        <EmptyState title="Servico nao encontrado" description="O servico solicitado nao existe." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Editar Servico</Text>
      <Text style={styles.screenSubtitle}>{service.name}</Text>

      <View style={styles.formContainer}>
        <FormInput
          label="Nome"
          required
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          error={errors.name}
          placeholder="Nome do servico"
        />

        <FormInput
          label="Descricao"
          value={form.description}
          onChangeText={(text) => updateField('description', text)}
          placeholder="Descricao do servico"
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <FormInput
          label="Categoria"
          value={form.category}
          onChangeText={(text) => updateField('category', text)}
          placeholder="Ex: Mecanica, Eletrica..."
        />

        <FormCurrency
          label="Preco Base"
          required
          value={form.base_price}
          onChangeValue={(value) => updateField('base_price', value)}
          error={errors.base_price}
        />

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
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
