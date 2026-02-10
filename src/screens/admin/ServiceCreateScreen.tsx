import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { FormInput } from '@/components/forms/FormInput';
import { FormCurrency } from '@/components/forms/FormCurrency';
import { FormSelect } from '@/components/forms/FormSelect';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { SelectOption } from '@/types';

interface ServiceForm {
  name: string;
  description: string;
  category_id: string;
  base_price: number;
}

interface FormErrors {
  name?: string;
  category_id?: string;
  base_price?: string;
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  description: '',
  category_id: '',
  base_price: 0,
};

export default function ServiceCreateScreen() {
  const router = useRouter();
  const styles = useThemeStyles(createStyles);

  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.getCategories({ active: true, per_page: 100 });
        const cats = res.data || res;
        setCategoryOptions(cats.map((c: any) => ({ label: c.name, value: c.id })));
      } catch {}
    })();
  }, []);

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
      if (form.category_id) data.category_id = form.category_id;

      await adminApi.createService(data);
      Alert.alert('Sucesso', 'Servico cadastrado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao cadastrar servico';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, router]);

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Novo Servico</Text>
      <Text style={styles.screenSubtitle}>Preencha os dados para cadastrar um servico</Text>

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

        <FormSelect
          label="Categoria"
          value={form.category_id}
          options={categoryOptions}
          onValueChange={(value) => updateField('category_id', value)}
          error={errors.category_id}
          placeholder="Selecione a categoria..."
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
          Cadastrar Servico
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
