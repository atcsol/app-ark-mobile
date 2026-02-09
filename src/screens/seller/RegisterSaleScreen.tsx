import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { sellerApi } from '@/services/sellerApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen } from '@/components/ui';
import { FormInput, FormSelect, FormCurrency, FormDatePicker } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Vehicle, SelectOption, PaginatedResponse } from '@/types';

interface FormData {
  vehicle_id: number | undefined;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_document: string;
  sale_value: number;
  sale_date: string;
  notes: string;
}

interface FormErrors {
  vehicle_id?: string;
  buyer_name?: string;
  sale_value?: string;
  sale_date?: string;
}

export default function RegisterSaleScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const router = useRouter();
  const params = useLocalSearchParams<{ vehicleId?: string; vehicleName?: string }>();

  const [form, setForm] = useState<FormData>({
    vehicle_id: params.vehicleId ? Number(params.vehicleId) : undefined,
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    buyer_document: '',
    sale_value: 0,
    sale_date: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [saleDate, setSaleDate] = useState<Date | undefined>(undefined);

  // Vehicle options for select
  const [vehicleOptions, setVehicleOptions] = useState<SelectOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response: PaginatedResponse<Vehicle> =
          await sellerApi.getAvailableVehicles({ per_page: 100 });
        const options: SelectOption[] = response.data.map((v) => ({
          label: `${v.brand} ${v.model} ${v.year} - ${v.vin_number}`,
          value: String(v.id),
        }));
        setVehicleOptions(options);
      } catch (err: any) {
        console.error('Erro ao carregar veiculos:', err.message);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
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

    if (!form.vehicle_id) {
      newErrors.vehicle_id = 'Selecione um veiculo';
    }
    if (!form.buyer_name.trim()) {
      newErrors.buyer_name = 'Nome do comprador e obrigatorio';
    }
    if (!form.sale_value || form.sale_value <= 0) {
      newErrors.sale_value = 'Valor da venda e obrigatorio';
    }
    if (!form.sale_date) {
      newErrors.sale_date = 'Data da venda e obrigatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const data: Record<string, any> = {
        vehicle_id: form.vehicle_id!,
        sale_value: form.sale_value,
        sale_date: form.sale_date,
        buyer_name: form.buyer_name.trim(),
      };

      if (form.buyer_email.trim()) data.buyer_email = form.buyer_email.trim();
      if (form.buyer_phone.trim()) data.buyer_phone = form.buyer_phone.trim();
      if (form.buyer_document.trim()) data.buyer_document = form.buyer_document.trim();
      if (form.notes.trim()) data.notes = form.notes.trim();

      await sellerApi.registerSale(data as any);
      Alert.alert('Sucesso', 'Venda registrada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao registrar venda';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, router]);

  const handleDateChange = useCallback(
    (date: Date) => {
      setSaleDate(date);
      const isoDate = date.toISOString().split('T')[0];
      updateField('sale_date', isoDate);
    },
    [updateField],
  );

  if (loadingVehicles) {
    return <LoadingScreen message="Carregando veiculos..." />;
  }

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Registrar Venda</Text>
      <Text style={styles.screenSubtitle}>Preencha os dados para registrar uma venda</Text>

      <View style={styles.formContainer}>
        <FormSelect
          label="Veiculo"
          required
          placeholder="Selecione o veiculo..."
          value={form.vehicle_id ? String(form.vehicle_id) : undefined}
          options={vehicleOptions}
          onValueChange={(value) => updateField('vehicle_id', Number(value))}
          error={errors.vehicle_id}
        />

        <FormInput
          label="Nome do Comprador"
          required
          value={form.buyer_name}
          onChangeText={(text) => updateField('buyer_name', text)}
          error={errors.buyer_name}
          placeholder="Nome completo do comprador"
        />

        <FormInput
          label="Email do Comprador"
          value={form.buyer_email}
          onChangeText={(text) => updateField('buyer_email', text)}
          placeholder="email@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormInput
          label="Telefone do Comprador"
          value={form.buyer_phone}
          onChangeText={(text) => updateField('buyer_phone', text)}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
        />

        <FormInput
          label="CPF/CNPJ do Comprador"
          value={form.buyer_document}
          onChangeText={(text) => updateField('buyer_document', text)}
          placeholder="000.000.000-00"
          keyboardType="numeric"
        />

        <FormCurrency
          label="Valor da Venda"
          required
          value={form.sale_value}
          onChangeValue={(value) => updateField('sale_value', value)}
          error={errors.sale_value}
        />

        <FormDatePicker
          label="Data da Venda"
          required
          value={saleDate}
          onChange={handleDateChange}
          maxDate={new Date()}
          error={errors.sale_date}
        />

        <FormInput
          label="Observacoes"
          value={form.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Notas adicionais sobre a venda..."
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
          Registrar Venda
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
