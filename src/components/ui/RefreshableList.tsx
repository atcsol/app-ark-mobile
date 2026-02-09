import React from 'react';
import { FlatList, View, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { EmptyState } from './EmptyState';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';

interface Props<T> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  ListHeaderComponent?: React.ReactElement;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactElement;
  contentContainerStyle?: any;
  ItemSeparatorComponent?: React.ComponentType;
}

export function RefreshableList<T>({
  data,
  renderItem,
  keyExtractor,
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  hasMore = false,
  ListHeaderComponent,
  emptyTitle,
  emptyDescription,
  emptyAction,
  contentContainerStyle,
  ItemSeparatorComponent,
}: Props<T>) {
  const { colors } = useTheme();

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        title={emptyTitle || 'Nenhum resultado'}
        description={emptyDescription || 'Nao ha dados para exibir.'}
        action={emptyAction}
      />
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmpty()}
      ListFooterComponent={renderFooter()}
      ItemSeparatorComponent={ItemSeparatorComponent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        data.length === 0 && styles.emptyContainer,
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      onEndReached={hasMore ? onEndReached : undefined}
      onEndReachedThreshold={0.3}
    />
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
