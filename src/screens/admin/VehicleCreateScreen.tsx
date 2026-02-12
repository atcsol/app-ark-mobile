import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ScreenContainer } from '@/components/layout';
import { FormInput, FormCurrency, FormDatePicker, FormSelect } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { VehicleFormData, SelectOption } from '@/types';
import type { Brand } from '@/types/part';

interface FormErrors {
  vin_number?: string;
  brand?: string;
  year?: string;
  purchase_value?: string;
}

export default function VehicleCreateScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { handleError } = useErrorHandler();
  const router = useRouter();

  const [form, setForm] = useState<VehicleFormData>({
    vin_number: '',
    brand_id: undefined,
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

  // Brand & Model state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);
  const [modelOptions, setModelOptions] = useState<SelectOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [decodingVin, setDecodingVin] = useState(false);

  // Load brands on mount
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await adminApi.getBrands({ type: 'vehicle', active: true, per_page: 500 });
        const brandList: Brand[] = response?.data || response || [];
        setBrands(brandList);
        setBrandOptions(
          brandList.map((b) => ({ label: b.name, value: String(b.id) }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      } catch (err) {
        console.error('Error loading brands:', err);
      }
    };
    loadBrands();
  }, []);

  const updateField = useCallback(
    <K extends keyof VehicleFormData>(key: K, value: VehicleFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors],
  );

  const handleBrandChange = useCallback(
    async (brandId: string) => {
      const selectedBrand = brands.find((b) => String(b.id) === brandId);
      updateField('brand_id', brandId);
      updateField('brand', selectedBrand?.name || '');
      updateField('model', '');
      setModelOptions([]);

      if (selectedBrand) {
        try {
          setLoadingModels(true);
          const response = await adminApi.getVehicleModels(selectedBrand.name);
          const models = response?.data || response || [];
          setModelOptions(
            models.map((m: any) => ({ label: m.model_name, value: m.model_name }))
          );
        } catch (err) {
          console.error('Error loading models:', err);
        } finally {
          setLoadingModels(false);
        }
      }
    },
    [brands, updateField],
  );

  const handleModelChange = useCallback(
    (modelName: string) => {
      updateField('model', modelName);
    },
    [updateField],
  );

  const handleVinChange = useCallback(
    async (text: string) => {
      const vin = text.toUpperCase().trim();
      updateField('vin_number', vin);

      if (vin.length === 17) {
        try {
          setDecodingVin(true);
          const response = await adminApi.decodeVin(vin);
          const vinData = response?.data || response;
          if (!vinData) return;

          // Auto-fill year and color
          if (vinData.year) updateField('year', Number(vinData.year));
          if (vinData.color) updateField('color', vinData.color);

          // Auto-select brand
          if (vinData.brand) {
            const matchingBrand = brands.find(
              (b) => b.name.toLowerCase() === vinData.brand.toLowerCase()
            );
            if (matchingBrand) {
              updateField('brand_id', String(matchingBrand.id));
              updateField('brand', matchingBrand.name);

              // Load models for this brand
              try {
                setLoadingModels(true);
                const modelsResponse = await adminApi.getVehicleModels(matchingBrand.name);
                const models = modelsResponse?.data || modelsResponse || [];
                const opts = models.map((m: any) => ({ label: m.model_name, value: m.model_name }));
                setModelOptions(opts);

                // Auto-select model
                if (vinData.model) {
                  const matchingModel = models.find(
                    (m: any) => m.model_name.toLowerCase() === vinData.model.toLowerCase()
                  );
                  if (matchingModel) {
                    updateField('model', matchingModel.model_name);
                  } else {
                    updateField('model', vinData.model);
                  }
                }
              } catch (err) {
                console.error('Error loading models after VIN decode:', err);
              } finally {
                setLoadingModels(false);
              }
            }
          }
        } catch (err) {
          console.error('VIN decode failed:', err);
        } finally {
          setDecodingVin(false);
        }
      }
    },
    [brands, updateField],
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.vin_number.trim()) {
      newErrors.vin_number = 'VIN e obrigatorio';
    }
    if (!form.brand) {
      newErrors.brand = 'Marca e obrigatoria';
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
        model: form.model,
        year: form.year,
        purchase_value: form.purchase_value,
      };

      if (form.brand_id) data.brand_id = form.brand_id;
      if (form.color?.trim()) data.color = form.color.trim();
      if (form.mileage) data.mileage = form.mileage;
      if (form.purchase_date) data.purchase_date = form.purchase_date;
      if (form.notes?.trim()) data.notes = form.notes.trim();

      await adminApi.createVehicle(data);
      Alert.alert('Sucesso', 'Veiculo cadastrado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      handleError(error, 'createVehicle');
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
          onChangeText={handleVinChange}
          error={errors.vin_number}
          placeholder="Ex: 1HGCM82633A004352"
          autoCapitalize="characters"
          maxLength={17}
        />

        {decodingVin && (
          <Text style={{ ...body.sm, color: colors.accent, marginBottom: spacing.sm }}>
            Consultando dados do VIN...
          </Text>
        )}

        <FormSelect
          label="Marca"
          required
          value={form.brand_id ? String(form.brand_id) : undefined}
          options={brandOptions}
          onValueChange={handleBrandChange}
          error={errors.brand}
          placeholder="Selecione a marca..."
          searchable
        />

        <FormSelect
          label="Modelo"
          value={form.model || undefined}
          options={modelOptions}
          onValueChange={handleModelChange}
          error={errors.model}
          placeholder={loadingModels ? 'Carregando modelos...' : 'Selecione o modelo...'}
          disabled={!form.brand_id || loadingModels}
          searchable
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
