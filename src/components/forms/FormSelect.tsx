import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { spacing, body, caption, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { SelectOption } from '@/types';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Props {
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
  value: string | number | undefined;
  options: SelectOption[];
  onValueChange: (value: string) => void;
}

export function FormSelect({
  label,
  required = false,
  error,
  disabled = false,
  placeholder = 'Selecione...',
  searchable,
  value,
  options,
  onValueChange,
}: Props) {
  const styles = useThemeStyles(createStyles);
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const selectedOption = options.find((o) => String(o.value) === String(value));

  const showSearch = searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, search]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setVisible(false);
    setSearch('');
  };

  const handleClose = () => {
    setVisible(false);
    setSearch('');
  };

  const renderOption = ({ item }: { item: SelectOption }) => {
    const isSelected = String(item.value) === String(value);
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => handleSelect(String(item.value))}
        activeOpacity={0.6}
      >
        {item.icon ? (
          <View style={styles.optionIcon}>
            <IconOutline
              name={item.icon as any}
              size={18}
              color={item.color || (isSelected ? styles.optionTextSelected.color : styles.optionText.color)}
            />
          </View>
        ) : null}
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {item.label}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          styles.trigger,
          error ? styles.triggerError : null,
          disabled ? styles.triggerDisabled : null,
        ]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        {selectedOption?.icon ? (
          <View style={styles.triggerIcon}>
            <IconOutline
              name={selectedOption.icon as any}
              size={16}
              color={selectedOption.color || styles.triggerText.color}
            />
          </View>
        ) : null}
        <Text
          style={[styles.triggerText, !selectedOption && !value && styles.placeholder]}
          numberOfLines={1}
        >
          {selectedOption?.label || (value ? String(value) : placeholder)}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
        <View style={styles.overlay}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          {/* Bottom sheet */}
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{label}</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.headerClose}>Fechar</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            {showSearch && (
              <View style={styles.searchWrap}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Buscar ${label.toLowerCase()}...`}
                  placeholderTextColor="#999"
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
            )}

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              renderItem={renderOption}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>Nenhum resultado</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SHEET_MAX = SCREEN_HEIGHT * 0.6;
const BOTTOM_SAFE = Platform.OS === 'ios' ? 34 : 16;

const createStyles = (colors: Colors) => ({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...caption.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  trigger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    backgroundColor: colors.white,
  },
  triggerError: {
    borderColor: colors.error,
  },
  triggerDisabled: {
    backgroundColor: colors.gray100,
  },
  triggerIcon: {
    marginRight: spacing.sm,
  },
  triggerText: {
    ...body.md,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: colors.textPlaceholder,
  },
  chevron: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  error: {
    ...caption.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end' as const,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: 16,
    maxHeight: SHEET_MAX,
    paddingBottom: BOTTOM_SAFE,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  handleRow: {
    alignItems: 'center' as const,
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  headerClose: {
    ...body.md,
    color: colors.accent,
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  searchInput: {
    ...body.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 38,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  option: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  optionSelected: {
    backgroundColor: colors.accent + '10',
  },
  optionIcon: {
    marginRight: spacing.sm,
    width: 22,
    alignItems: 'center' as const,
  },
  optionText: {
    ...body.md,
    color: colors.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  checkmark: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: spacing.sm,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center' as const,
  },
  emptyText: {
    ...body.sm,
    color: colors.textTertiary,
  },
});
