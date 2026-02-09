import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { FormInput } from '@/components/forms';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface InvestorForm {
  name: string;
  email: string;
  phone: string;
  ssn: string;
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

export default function InvestorCreateScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const router = useRouter();

  const [form, setForm] = useState<InvestorForm>({
    name: '',
    email: '',
    phone: '',
    ssn: '',
    street: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback(
    (key: keyof InvestorForm, value: string) => {
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

      const address: Record<string, string> = {};
      if (form.street?.trim()) address.street = form.street.trim();
      if (form.apt?.trim()) address.apt = form.apt.trim();
      if (form.city?.trim()) address.city = form.city.trim();
      if (form.state?.trim()) address.state = form.state.trim();
      if (form.zip?.trim()) address.zip = form.zip.trim();

      if (Object.keys(address).length > 0) {
        data.address = address;
      }

      await adminApi.createInvestor(data);
      Alert.alert('Sucesso', 'Investidor cadastrado com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao cadastrar investidor';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, router]);

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Novo Investidor</Text>
      <Text style={styles.screenSubtitle}>Preencha os dados para cadastrar um investidor</Text>

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
          Cadastrar Investidor
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
