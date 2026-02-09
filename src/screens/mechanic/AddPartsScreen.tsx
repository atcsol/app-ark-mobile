import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { mechanicApi } from '@/services/mechanicApi';
import apiClient from '@/services/api';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen } from '@/components/ui';
import { FormInput, FormSelect } from '@/components/forms';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import type { Part, SelectOption } from '@/types';

interface PartRow {
  id: string;
  part_id: string;
  quantity: string;
}

function createEmptyRow(): PartRow {
  return {
    id: String(Date.now()) + String(Math.random()),
    part_id: '',
    quantity: '1',
  };
}

export default function AddPartsScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [parts, setParts] = useState<Part[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState<PartRow[]>([createEmptyRow()]);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await apiClient.get('/parts');
        const data = response.data || response;
        setParts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || 'Erro ao carregar pecas';
        Alert.alert('Erro', message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchParts();
  }, []);

  const partOptions: SelectOption[] = parts.map((p) => ({
    label: `${p.name}${p.part_number ? ` (${p.part_number})` : ''} - ${formatCurrency(p.unit_price)}`,
    value: String(p.id),
  }));

  const handleUpdateRow = useCallback(
    (rowId: string, field: keyof Omit<PartRow, 'id'>, value: string) => {
      setRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
      );
    },
    [],
  );

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, []);

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      if (rows.length <= 1) return;
      setRows((prev) => prev.filter((row) => row.id !== rowId));
    },
    [rows.length],
  );

  const validate = useCallback((): boolean => {
    for (const row of rows) {
      if (!row.part_id) {
        Alert.alert('Erro', 'Selecione uma peca para todas as linhas.');
        return false;
      }
      const qty = parseInt(row.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        Alert.alert('Erro', 'A quantidade deve ser maior que zero.');
        return false;
      }
    }
    return true;
  }, [rows]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const partsData = rows.map((row) => ({
        part_id: parseInt(row.part_id, 10),
        quantity: parseInt(row.quantity, 10),
      }));

      await mechanicApi.addParts(uuid!, partsData);
      Alert.alert('Sucesso', 'Pecas adicionadas com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao adicionar pecas';
      Alert.alert('Erro', message);
    } finally {
      setSubmitting(false);
    }
  }, [rows, uuid, validate, router]);

  if (loadingData) {
    return <LoadingScreen message="Carregando pecas disponiveis..." />;
  }

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Adicionar Pecas ao Servico</Text>
      <Text style={styles.screenSubtitle}>Selecione as pecas e quantidades</Text>

      <View style={styles.formContainer}>
        {rows.map((row, index) => (
          <View key={row.id} style={styles.partRow}>
            <View style={styles.partRowHeader}>
              <Text style={styles.partRowTitle}>Peca {index + 1}</Text>
              {rows.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleRemoveRow(row.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeText}>Remover</Text>
                </TouchableOpacity>
              )}
            </View>

            <FormSelect
              label="Peca"
              required
              value={row.part_id}
              options={partOptions}
              onValueChange={(value) => handleUpdateRow(row.id, 'part_id', value)}
              placeholder="Selecione a peca..."
            />

            <FormInput
              label="Quantidade"
              required
              value={row.quantity}
              onChangeText={(text) => handleUpdateRow(row.id, 'quantity', text.replace(/\D/g, ''))}
              placeholder="Ex: 2"
              keyboardType="numeric"
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.addRowButton}
          onPress={handleAddRow}
          activeOpacity={0.7}
        >
          <Text style={styles.addRowText}>+ Adicionar mais peca</Text>
        </TouchableOpacity>

        <Button
          type="primary"
          style={styles.submitButton}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          Adicionar Pecas
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
  partRow: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  partRowHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  partRowTitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  removeText: {
    ...body.sm,
    color: colors.error,
    fontWeight: '500' as const,
  },
  addRowButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed' as const,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    marginBottom: spacing.xl,
  },
  addRowText: {
    ...body.md,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
