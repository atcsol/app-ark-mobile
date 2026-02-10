import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { FormInput, FormCurrency, FormSelect } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { SelectOption } from '@/types';

interface FormData {
  name: string;
  part_number: string;
  brand_id: string;
  category_id: string;
  description: string;
  unit_price: number;
  stock_quantity: number;
  min_stock: number;
}

interface FormErrors {
  name?: string;
  part_number?: string;
  brand_id?: string;
  category_id?: string;
  unit_price?: string;
  stock_quantity?: string;
  min_stock?: string;
}

export default function PartCreateScreen() {
  const styles = useThemeStyles(createStyles);
  const router = useRouter();

  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);

  const [form, setForm] = useState<FormData>({
    name: '',
    part_number: '',
    brand_id: '',
    category_id: '',
    description: '',
    unit_price: 0,
    stock_quantity: 0,
    min_stock: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          adminApi.getCategories({ active: true, per_page: 100 }),
          adminApi.getBrands({ active: true, type: 'part', per_page: 100 }),
        ]);
        const cats = catRes.data || catRes;
        setCategoryOptions(cats.map((c: any) => ({ label: c.name, value: c.id })));
        const brands = brandRes.data || brandRes;
        setBrandOptions(brands.map((b: any) => ({ label: b.name, value: b.id })));
      } catch {}
    })();
  }, []);

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
    if (!form.category_id) {
      newErrors.category_id = 'Categoria e obrigatoria';
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
        category_id: form.category_id,
        unit_price: form.unit_price,
        stock_quantity: form.stock_quantity,
        min_stock: form.min_stock,
      };

      if (form.brand_id) data.brand_id = form.brand_id;
      if (form.description.trim()) data.description = form.description.trim();

      await adminApi.createPart(data);
      Alert.alert('Sucesso', 'Peca cadastrada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao cadastrar peca';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, router]);

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Nova Peca</Text>
      <Text style={styles.screenSubtitle}>Preencha os dados para cadastrar uma peca</Text>

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

        <FormSelect
          label="Marca"
          value={form.brand_id}
          options={brandOptions}
          onValueChange={(value) => updateField('brand_id', value)}
          error={errors.brand_id}
          placeholder="Selecione a marca..."
        />

        <FormSelect
          label="Categoria"
          required
          value={form.category_id}
          options={categoryOptions}
          onValueChange={(value) => updateField('category_id', value)}
          error={errors.category_id}
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
          Cadastrar Peca
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
