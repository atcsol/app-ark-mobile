import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState } from '@/components/ui';
import { FormInput } from '@/components/forms';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Category } from '@/types';
import { PRESET_COLORS, PRESET_ICONS } from '@/constants';

interface FormData {
  name: string;
  color: string;
  icon: string;
}

interface FormErrors {
  name?: string;
}

export default function CategoryEditScreen() {
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name: '',
    color: 'blue',
    icon: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCategory = useCallback(async () => {
    try {
      setError(null);
      const response = await adminApi.getCategory(uuid!);
      const c: Category = (response as any)?.data ?? response;
      setCategory(c);
      setForm({
        name: c.name,
        color: c.color || 'blue',
        icon: c.icon || '',
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar categoria';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) {
      fetchCategory();
    }
  }, [fetchCategory, uuid]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload: Record<string, any> = {
        name: form.name.trim(),
        color: form.color,
      };
      if (form.icon) {
        payload.icon = form.icon;
      } else {
        payload.icon = null;
      }

      await adminApi.updateCategory(uuid!, payload);
      Alert.alert('Sucesso', 'Categoria atualizada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao atualizar categoria';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, uuid, router]);

  const handleIconPress = useCallback((iconName: string) => {
    updateField('icon', form.icon === iconName ? '' : iconName);
  }, [form.icon, updateField]);

  if (loading) {
    return <LoadingScreen message="Carregando categoria..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!category) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Categoria nao encontrada"
          description="A categoria solicitada nao existe."
        />
      </ScreenContainer>
    );
  }

  const selectedIcon = PRESET_ICONS.find((i) => i.name === form.icon);

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Editar Categoria</Text>
      <Text style={styles.screenSubtitle}>{category.name}</Text>

      <View style={styles.formContainer}>
        <FormInput
          label="Nome"
          required
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          error={errors.name}
          placeholder="Ex: Motor"
          autoCapitalize="words"
        />

        <Text style={styles.colorLabel}>Icone (opcional)</Text>
        <View style={styles.iconGrid}>
          {PRESET_ICONS.map((icon) => {
            const isSelected = form.icon === icon.name;
            return (
              <TouchableOpacity
                key={icon.name}
                style={[styles.iconOption, isSelected && styles.iconOptionSelected]}
                onPress={() => handleIconPress(icon.name)}
                activeOpacity={0.7}
              >
                <IconOutline
                  name={icon.name as any}
                  size={22}
                  color={isSelected ? '#ffffff' : styles.iconColor.color}
                />
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.iconName}>{selectedIcon?.label || 'Nenhum'}</Text>

        <Text style={styles.colorLabel}>Cor</Text>
        <View style={styles.colorGrid}>
          {PRESET_COLORS.map((preset) => {
            const isSelected = form.color === preset.value;
            return (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: preset.hex },
                  isSelected && styles.colorOptionSelected,
                ]}
                onPress={() => updateField('color', preset.value)}
                activeOpacity={0.7}
              >
                {isSelected && <Text style={styles.colorCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.colorName}>
          {PRESET_COLORS.find((c) => c.value === form.color)?.label || form.color}
        </Text>

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
  colorLabel: {
    ...caption.md,
    color: colors.textSecondary,
    fontWeight: '600' as const,
    marginBottom: spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  iconColor: {
    color: colors.textSecondary,
  },
  iconName: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  colorGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheck: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  colorName: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
