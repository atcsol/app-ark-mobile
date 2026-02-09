import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState } from '@/components/ui';
import { FormInput, FormSelect } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Mechanic } from '@/types';

const SPECIALTY_OPTIONS = [
  { label: 'Mecanica Geral', value: 'Mecanica Geral' },
  { label: 'Motor', value: 'Motor' },
  { label: 'Transmissao', value: 'Transmissao' },
  { label: 'Suspensao', value: 'Suspensao' },
  { label: 'Freios', value: 'Freios' },
  { label: 'Sistema Eletrico', value: 'Sistema Eletrico' },
  { label: 'Ar Condicionado', value: 'Ar Condicionado' },
  { label: 'Funilaria', value: 'Funilaria' },
  { label: 'Pintura', value: 'Pintura' },
  { label: 'Diagnostico Eletronico', value: 'Diagnostico Eletronico' },
  { label: 'Injecao Eletronica', value: 'Injecao Eletronica' },
  { label: 'Alinhamento e Balanceamento', value: 'Alinhamento e Balanceamento' },
];

const STATUS_OPTIONS = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

interface MechanicForm {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  hourly_rate: string;
  status: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  hourly_rate?: string;
}

export default function MechanicEditScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<MechanicForm>({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    hourly_rate: '',
    status: 'active',
    street: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchMechanic = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await adminApi.getMechanic(uuid!);
      const m: any = (response as any).data ?? response;
      setMechanic(m);

      const address = m.address || {};
      const specialties = m.specialties || [];
      setForm({
        name: m.name || '',
        email: m.email || '',
        phone: m.phone || '',
        specialty: Array.isArray(specialties) && specialties.length > 0 ? specialties[0] : '',
        hourly_rate: m.hourly_rate != null ? String(m.hourly_rate) : '',
        status: m.status || 'active',
        street: address.street || '',
        apt: address.apt || '',
        city: address.city || '',
        state: address.state || '',
        zip: address.zip || '',
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar mecanico';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) {
      fetchMechanic();
    }
  }, [fetchMechanic, uuid]);

  const updateField = useCallback(
    (key: keyof MechanicForm, value: string) => {
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
    if (form.hourly_rate.trim()) {
      const val = parseFloat(form.hourly_rate);
      if (isNaN(val) || val < 0) {
        newErrors.hourly_rate = 'Valor por hora invalido';
      }
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
        email: form.email.trim(),
      };

      if (form.phone?.trim()) data.phone = form.phone.trim();
      if (form.specialty) data.specialties = [form.specialty];
      if (form.hourly_rate.trim()) {
        data.hourly_rate = parseFloat(form.hourly_rate);
      }
      if (form.status) data.status = form.status;

      const address: Record<string, string> = {};
      if (form.street?.trim()) address.street = form.street.trim();
      if (form.apt?.trim()) address.apt = form.apt.trim();
      if (form.city?.trim()) address.city = form.city.trim();
      if (form.state?.trim()) address.state = form.state.trim();
      if (form.zip?.trim()) address.zip = form.zip.trim();

      if (Object.keys(address).length > 0) {
        data.address = address;
      }

      await adminApi.updateMechanic(uuid!, data);
      Alert.alert('Sucesso', 'Mecanico atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao atualizar mecanico';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, uuid, router]);

  if (loading) {
    return <LoadingScreen message="Carregando mecanico..." />;
  }

  if (loadError) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={loadError} />
      </ScreenContainer>
    );
  }

  if (!mechanic) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Mecanico nao encontrado"
          description="O mecanico solicitado nao existe."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Editar Mecanico</Text>
      <Text style={styles.screenSubtitle}>{mechanic.name}</Text>

      <View style={styles.formContainer}>
        <FormInput
          label="Nome"
          required
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          error={errors.name}
          placeholder="Nome completo"
        />

        <FormInput
          label="Email"
          required
          value={form.email}
          onChangeText={(text) => updateField('email', text)}
          error={errors.email}
          placeholder="email@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormInput
          label="Telefone"
          value={form.phone}
          onChangeText={(text) => updateField('phone', text)}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
        />

        <FormSelect
          label="Especialidade"
          value={form.specialty}
          options={SPECIALTY_OPTIONS}
          onValueChange={(value) => updateField('specialty', value)}
          placeholder="Selecione a especialidade..."
        />

        <FormInput
          label="Valor por Hora (USD)"
          value={form.hourly_rate}
          onChangeText={(text) => updateField('hourly_rate', text)}
          error={errors.hourly_rate}
          placeholder="Ex: 50.00"
          keyboardType="numeric"
        />

        <FormSelect
          label="Status"
          value={form.status}
          options={STATUS_OPTIONS}
          onValueChange={(value) => updateField('status', value)}
        />

        <Text style={styles.sectionLabel}>Endereco</Text>

        <FormInput
          label="Rua"
          value={form.street}
          onChangeText={(text) => updateField('street', text)}
          placeholder="Endereco"
        />

        <FormInput
          label="Complemento"
          value={form.apt}
          onChangeText={(text) => updateField('apt', text)}
          placeholder="Apt, Suite, etc."
        />

        <View style={styles.row}>
          <View style={styles.rowHalf}>
            <FormInput
              label="Cidade"
              value={form.city}
              onChangeText={(text) => updateField('city', text)}
              placeholder="Cidade"
            />
          </View>
          <View style={styles.rowQuarter}>
            <FormInput
              label="Estado"
              value={form.state}
              onChangeText={(text) => updateField('state', text)}
              placeholder="UF"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.rowQuarter}>
            <FormInput
              label="CEP"
              value={form.zip}
              onChangeText={(text) => updateField('zip', text)}
              placeholder="00000"
              keyboardType="numeric"
            />
          </View>
        </View>

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
  sectionLabel: {
    ...heading.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  rowHalf: {
    flex: 2,
  },
  rowQuarter: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
