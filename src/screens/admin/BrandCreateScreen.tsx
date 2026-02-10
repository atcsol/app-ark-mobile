import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { FormInput, FormSelect } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { SelectOption } from '@/types';

const TYPE_OPTIONS: SelectOption[] = [
  { label: 'Veiculo', value: 'vehicle' },
  { label: 'Peca', value: 'part' },
  { label: 'Ambos', value: 'both' },
];

interface FormData {
  name: string;
  type: string;
}

interface FormErrors {
  name?: string;
  type?: string;
}

export default function BrandCreateScreen() {
  const styles = useThemeStyles(createStyles);
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: '',
    type: 'vehicle',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

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
    if (!form.type) {
      newErrors.type = 'Tipo e obrigatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      await adminApi.createBrand({
        name: form.name.trim(),
        type: form.type,
      });
      Alert.alert('Sucesso', 'Marca cadastrada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao cadastrar marca';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, router]);

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Nova Marca</Text>
      <Text style={styles.screenSubtitle}>Preencha os dados para cadastrar uma marca</Text>

      <View style={styles.formContainer}>
        <FormInput
          label="Nome"
          required
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          error={errors.name}
          placeholder="Ex: Toyota"
        />

        <FormSelect
          label="Tipo"
          required
          value={form.type}
          options={TYPE_OPTIONS}
          onValueChange={(value) => updateField('type', value)}
          error={errors.type}
          placeholder="Selecione o tipo..."
        />

        <Button
          type="primary"
          style={styles.submitButton}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          Cadastrar Marca
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
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
