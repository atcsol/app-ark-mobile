import React from 'react';
import { FlatList, View, ListRenderItemInfo, RefreshControl } from 'react-native';
import { useDeviceType } from '@/hooks';
import { spacing } from '@/theme';

interface Props<T> {
  data: T[];
  renderItem: (info: ListRenderItemInfo<T>) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  gap?: number;
}

export function ResponsiveGrid<T>({
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  ListHeaderComponent,
  refreshing,
  onRefresh,
  onEndReached,
  gap = spacing.md,
}: Props<T>) {
  const { columns } = useDeviceType();

  const wrappedRenderItem = (info: ListRenderItemInfo<T>) => (
    <View style={{ flex: 1, padding: gap / 2 }}>{renderItem(info)}</View>
  );

  return (
    <FlatList
      data={data}
      renderItem={wrappedRenderItem}
      keyExtractor={keyExtractor}
      numColumns={columns}
      key={`grid-${columns}`}
      contentContainerStyle={{ padding: gap / 2 }}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  );
}
