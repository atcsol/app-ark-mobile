import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { mechanicApi } from '@/services/mechanicApi';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen } from '@/components/ui';
import { FormInput, FormSelect, FormDatePicker } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import type { Vehicle, ServiceCatalog, SelectOption } from '@/types';

interface FormData {
  vehicle_id: string;
  service_id: string;
  service_date: Date | undefined;
  hours_worked: string;
  notes: string;
}

interface FormErrors {
  vehicle_id?: string;
  service_id?: string;
  service_date?: string;
}

const EMPTY_FORM: FormData = {
  vehicle_id: '',
  service_id: '',
  service_date: undefined,
  hours_worked: '',
  notes: '',
};

export default function AddServiceScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { handleError } = useErrorHandler();
  const router = useRouter();

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, servicesRes] = await Promise.all([
          mechanicApi.getMyVehicles(),
          mechanicApi.getServices(),
        ]);

        const vehiclesData = vehiclesRes.data || vehiclesRes;
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);

        const servicesData = servicesRes.data || servicesRes;
        setServiceCatalog(Array.isArray(servicesData) ? servicesData : []);
      } catch (error) {
        handleError(error, 'loadServiceData');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const vehicleOptions: SelectOption[] = vehicles.map((v) => ({
    label: `${v.brand} ${v.model} ${v.year} - ${v.vin_number}`,
    value: String(v.id),
  }));

  const serviceOptions: SelectOption[] = serviceCatalog.map((s) => ({
    label: `${s.name} (${formatCurrency(s.base_price)})`,
    value: String(s.id),
  }));

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
      newErrors.vehicle_id = 'Veiculo e obrigatorio';
    }
    if (!form.service_id) {
      newErrors.service_id = 'Servico e obrigatorio';
    }
    if (!form.service_date) {
      newErrors.service_date = 'Data do servico e obrigatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload: {
        vehicle_id: number;
        service_id: number;
        service_date: string;
        hours_worked?: number;
        notes?: string;
      } = {
        vehicle_id: parseInt(form.vehicle_id, 10),
        service_id: parseInt(form.service_id, 10),
        service_date: form.service_date!.toISOString().split('T')[0],
      };

      if (form.hours_worked.trim()) {
        const hours = parseFloat(form.hours_worked.replace(',', '.'));
        if (!isNaN(hours) && hours > 0) {
          payload.hours_worked = hours;
        }
      }

      if (form.notes.trim()) {
        payload.notes = form.notes.trim();
      }

      await mechanicApi.addService(payload);
      Alert.alert('Sucesso', 'Servico adicionado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      handleError(error, 'addService');
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, router]);

  const handleDateChange = useCallback(
    (date: Date) => {
      updateField('service_date', date);
    },
    [updateField],
  );

  if (loadingData) {
    return <LoadingScreen message="Carregando dados..." />;
  }

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Adicionar Servico</Text>
      <Text style={styles.screenSubtitle}>Preencha os dados para registrar um novo servico</Text>

      <View style={styles.formContainer}>
        <FormSelect
          label="Veiculo"
          required
          value={form.vehicle_id}
          options={vehicleOptions}
          onValueChange={(value) => updateField('vehicle_id', value)}
          error={errors.vehicle_id}
          placeholder="Selecione o veiculo..."
        />

        <FormSelect
          label="Servico"
          required
          value={form.service_id}
          options={serviceOptions}
          onValueChange={(value) => updateField('service_id', value)}
          error={errors.service_id}
          placeholder="Selecione o servico..."
        />

        <FormDatePicker
          label="Data do Servico"
          required
          value={form.service_date}
          onChange={handleDateChange}
          error={errors.service_date}
        />

        <FormInput
          label="Horas Trabalhadas"
          value={form.hours_worked}
          onChangeText={(text) => updateField('hours_worked', text)}
          placeholder="Ex: 2.5"
          keyboardType="decimal-pad"
        />

        <FormInput
          label="Observacoes"
          value={form.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Notas adicionais sobre o servico..."
          multiline
          numberOfLines={4}
        />

        <Button
          type="primary"
          style={styles.submitButton}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          Adicionar Servico
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
