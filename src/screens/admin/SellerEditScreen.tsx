import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
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
import type { Seller } from '@/types';

interface SellerForm {
  name: string;
  email: string;
  phone: string;
  ssn: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  commission_percentage: string;
  status: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  commission_percentage?: string;
}

const STATUS_OPTIONS = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

export default function SellerEditScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<SellerForm>({
    name: '',
    email: '',
    phone: '',
    ssn: '',
    street: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
    commission_percentage: '',
    status: 'active',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchSeller = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await adminApi.getSeller(uuid!);
      const s: any = (response as any).data ?? response;
      setSeller(s);

      const address = s.address || {};
      setForm({
        name: s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        ssn: s.ssn || s.cpf_cnpj || '',
        street: address.street || '',
        apt: address.apt || '',
        city: address.city || '',
        state: address.state || '',
        zip: address.zip || '',
        commission_percentage: s.commission_percentage != null ? String(s.commission_percentage) : '',
        status: s.status || 'active',
        notes: s.notes || '',
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar vendedor';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) {
      fetchSeller();
    }
  }, [fetchSeller, uuid]);

  const updateField = useCallback(
    (key: keyof SellerForm, value: string) => {
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
    if (form.commission_percentage.trim()) {
      const val = parseFloat(form.commission_percentage);
      if (isNaN(val) || val < 0 || val > 100) {
        newErrors.commission_percentage = 'Comissao deve ser entre 0 e 100';
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
      if (form.ssn?.trim()) data.ssn = form.ssn.trim();
      if (form.commission_percentage.trim()) {
        data.commission_percentage = parseFloat(form.commission_percentage);
      }
      if (form.status) data.status = form.status;
      if (form.notes?.trim()) data.notes = form.notes.trim();

      const address: Record<string, string> = {};
      if (form.street?.trim()) address.street = form.street.trim();
      if (form.apt?.trim()) address.apt = form.apt.trim();
      if (form.city?.trim()) address.city = form.city.trim();
      if (form.state?.trim()) address.state = form.state.trim();
      if (form.zip?.trim()) address.zip = form.zip.trim();

      if (Object.keys(address).length > 0) {
        data.address = address;
      }

      await adminApi.updateSeller(uuid!, data);
      Alert.alert('Sucesso', 'Vendedor atualizado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao atualizar vendedor';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, uuid, router]);

  if (loading) {
    return <LoadingScreen message="Carregando vendedor..." />;
  }

  if (loadError) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={loadError} />
      </ScreenContainer>
    );
  }

  if (!seller) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Vendedor nao encontrado"
          description="O vendedor solicitado nao existe."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Editar Vendedor</Text>
      <Text style={styles.screenSubtitle}>{seller.name}</Text>

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

        <FormInput
          label="SSN"
          value={form.ssn}
          onChangeText={(text) => updateField('ssn', text)}
          placeholder="000-00-0000"
        />

        <FormInput
          label="Comissao (%)"
          value={form.commission_percentage}
          onChangeText={(text) => updateField('commission_percentage', text)}
          error={errors.commission_percentage}
          placeholder="Ex: 10"
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

        <FormInput
          label="Observacoes"
          value={form.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Notas adicionais sobre o vendedor..."
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
  textArea: {
    height: 100,
    textAlignVertical: 'top' as const,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
