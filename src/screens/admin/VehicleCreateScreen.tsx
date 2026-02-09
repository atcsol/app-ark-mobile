import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { FormInput, FormCurrency, FormDatePicker } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { VehicleFormData } from '@/types';

interface FormErrors {
  vin_number?: string;
  brand?: string;
  model?: string;
  year?: string;
  purchase_value?: string;
}

export default function VehicleCreateScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const router = useRouter();

  const [form, setForm] = useState<VehicleFormData>({
    vin_number: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    mileage: undefined,
    purchase_value: 0,
    purchase_date: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);

  const updateField = useCallback(
    <K extends keyof VehicleFormData>(key: K, value: VehicleFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.vin_number.trim()) {
      newErrors.vin_number = 'VIN e obrigatorio';
    }
    if (!form.brand.trim()) {
      newErrors.brand = 'Marca e obrigatoria';
    }
    if (!form.model.trim()) {
      newErrors.model = 'Modelo e obrigatorio';
    }
    if (!form.year || form.year < 1900 || form.year > new Date().getFullYear() + 2) {
      newErrors.year = 'Ano invalido';
    }
    if (!form.purchase_value || form.purchase_value <= 0) {
      newErrors.purchase_value = 'Valor de compra e obrigatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const data: Record<string, any> = {
        vin_number: form.vin_number.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year,
        purchase_value: form.purchase_value,
      };

      if (form.color?.trim()) data.color = form.color.trim();
      if (form.mileage) data.mileage = form.mileage;
      if (form.purchase_date) data.purchase_date = form.purchase_date;
      if (form.notes?.trim()) data.notes = form.notes.trim();

      await adminApi.createVehicle(data);
      Alert.alert('Sucesso', 'Veiculo cadastrado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao cadastrar veiculo';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, router]);

  const handleDateChange = useCallback(
    (date: Date) => {
      setPurchaseDate(date);
      const isoDate = date.toISOString().split('T')[0];
      updateField('purchase_date', isoDate);
    },
    [updateField],
  );

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Novo Veiculo</Text>
      <Text style={styles.screenSubtitle}>Preencha os dados para cadastrar um veiculo</Text>

      <View style={styles.formContainer}>
        <FormInput
          label="Numero VIN"
          required
          value={form.vin_number}
          onChangeText={(text) => updateField('vin_number', text)}
          error={errors.vin_number}
          placeholder="Ex: 1HGCM82633A004352"
          autoCapitalize="characters"
        />

        <FormInput
          label="Marca"
          required
          value={form.brand}
          onChangeText={(text) => updateField('brand', text)}
          error={errors.brand}
          placeholder="Ex: Honda"
        />

        <FormInput
          label="Modelo"
          required
          value={form.model}
          onChangeText={(text) => updateField('model', text)}
          error={errors.model}
          placeholder="Ex: Civic"
        />

        <FormInput
          label="Ano"
          required
          value={form.year ? String(form.year) : ''}
          onChangeText={(text) => {
            const num = parseInt(text.replace(/\D/g, ''), 10);
            updateField('year', isNaN(num) ? 0 : num);
          }}
          error={errors.year}
          placeholder="Ex: 2024"
          keyboardType="numeric"
          maxLength={4}
        />

        <FormInput
          label="Cor"
          value={form.color || ''}
          onChangeText={(text) => updateField('color', text)}
          placeholder="Ex: Preto"
        />

        <FormInput
          label="Quilometragem"
          value={form.mileage ? String(form.mileage) : ''}
          onChangeText={(text) => {
            const num = parseInt(text.replace(/\D/g, ''), 10);
            updateField('mileage', isNaN(num) ? undefined : num);
          }}
          placeholder="Ex: 50000"
          keyboardType="numeric"
        />

        <FormCurrency
          label="Valor de Compra"
          required
          value={form.purchase_value}
          onChangeValue={(value) => updateField('purchase_value', value)}
          error={errors.purchase_value}
        />

        <FormDatePicker
          label="Data de Compra"
          value={purchaseDate}
          onChange={handleDateChange}
          maxDate={new Date()}
        />

        <FormInput
          label="Observacoes"
          value={form.notes || ''}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Notas adicionais sobre o veiculo..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Button
          type="primary"
          style={styles.submitButton}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          Cadastrar Veiculo
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
