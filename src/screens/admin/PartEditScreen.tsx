import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState } from '@/components/ui';
import { FormInput, FormCurrency, FormSelect } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Part } from '@/types';

const CATEGORY_OPTIONS = [
  { label: 'Motor', value: 'Motor' },
  { label: 'Transmissao', value: 'Transmissao' },
  { label: 'Suspensao', value: 'Suspensao' },
  { label: 'Freios', value: 'Freios' },
  { label: 'Eletrica', value: 'Eletrica' },
  { label: 'Carroceria', value: 'Carroceria' },
  { label: 'Fluidos', value: 'Fluidos' },
  { label: 'Filtros', value: 'Filtros' },
  { label: 'Outros', value: 'Outros' },
];

interface FormData {
  name: string;
  part_number: string;
  brand: string;
  category: string;
  description: string;
  unit_price: number;
  stock_quantity: number;
  min_stock: number;
}

interface FormErrors {
  name?: string;
  part_number?: string;
  brand?: string;
  category?: string;
  unit_price?: string;
  stock_quantity?: string;
  min_stock?: string;
}

export default function PartEditScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name: '',
    part_number: '',
    brand: '',
    category: '',
    description: '',
    unit_price: 0,
    stock_quantity: 0,
    min_stock: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchPart = useCallback(async () => {
    try {
      setError(null);
      const response = await adminApi.getPart(uuid!);
      const p: Part = (response as any)?.data ?? response;
      setPart(p);

      setForm({
        name: p.name,
        part_number: p.part_number || '',
        brand: p.brand || '',
        category: p.category || '',
        description: p.description || '',
        unit_price: p.unit_price,
        stock_quantity: p.stock_quantity,
        min_stock: p.min_stock,
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar peca';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) {
      fetchPart();
    }
  }, [fetchPart, uuid]);

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
    if (!form.part_number.trim()) {
      newErrors.part_number = 'Numero da peca e obrigatorio';
    }
    if (!form.brand.trim()) {
      newErrors.brand = 'Fabricante e obrigatorio';
    }
    if (!form.category) {
      newErrors.category = 'Categoria e obrigatoria';
    }
    if (!form.unit_price || form.unit_price <= 0) {
      newErrors.unit_price = 'Preco unitario e obrigatorio';
    }
    if (form.stock_quantity < 0) {
      newErrors.stock_quantity = 'Estoque atual deve ser zero ou maior';
    }
    if (form.min_stock < 0) {
      newErrors.min_stock = 'Estoque minimo deve ser zero ou maior';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const data: Record<string, any> = {
        name: form.name.trim(),
        part_number: form.part_number.trim(),
        brand: form.brand.trim(),
        category: form.category,
        unit_price: form.unit_price,
        stock_quantity: form.stock_quantity,
        min_stock: form.min_stock,
      };

      if (form.description.trim()) {
        data.description = form.description.trim();
      }

      await adminApi.updatePart(uuid!, data);
      Alert.alert('Sucesso', 'Peca atualizada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao atualizar peca';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, uuid, router]);

  if (loading) {
    return <LoadingScreen message="Carregando peca..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!part) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Peca nao encontrada"
          description="A peca solicitada nao existe."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Editar Peca</Text>
      <Text style={styles.screenSubtitle}>{part.name}</Text>

      <View style={styles.formContainer}>
        <FormInput
          label="Nome"
          required
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          error={errors.name}
          placeholder="Ex: Filtro de oleo"
        />

        <FormInput
          label="Numero da Peca"
          required
          value={form.part_number}
          onChangeText={(text) => updateField('part_number', text)}
          error={errors.part_number}
          placeholder="Ex: FLT-001"
          autoCapitalize="characters"
        />

        <FormInput
          label="Fabricante"
          required
          value={form.brand}
          onChangeText={(text) => updateField('brand', text)}
          error={errors.brand}
          placeholder="Ex: Bosch"
        />

        <FormSelect
          label="Categoria"
          required
          value={form.category}
          options={CATEGORY_OPTIONS}
          onValueChange={(value) => updateField('category', value)}
          error={errors.category}
          placeholder="Selecione a categoria..."
        />

        <FormInput
          label="Descricao"
          value={form.description}
          onChangeText={(text) => updateField('description', text)}
          placeholder="Descricao da peca..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <FormCurrency
          label="Preco Unitario"
          required
          value={form.unit_price}
          onChangeValue={(value) => updateField('unit_price', value)}
          error={errors.unit_price}
        />

        <FormInput
          label="Estoque Atual"
          required
          value={form.stock_quantity ? String(form.stock_quantity) : ''}
          onChangeText={(text) => {
            const num = parseInt(text.replace(/\D/g, ''), 10);
            updateField('stock_quantity', isNaN(num) ? 0 : num);
          }}
          error={errors.stock_quantity}
          placeholder="Ex: 10"
          keyboardType="numeric"
        />

        <FormInput
          label="Estoque Minimo"
          required
          value={form.min_stock ? String(form.min_stock) : ''}
          onChangeText={(text) => {
            const num = parseInt(text.replace(/\D/g, ''), 10);
            updateField('min_stock', isNaN(num) ? 0 : num);
          }}
          error={errors.min_stock}
          placeholder="Ex: 5"
          keyboardType="numeric"
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
    height: 100,
    textAlignVertical: 'top' as const,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
