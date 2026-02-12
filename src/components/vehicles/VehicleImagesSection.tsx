import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { adminApi } from '@/services/adminApi';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { FallbackImage } from '@/components/ui';
import { usePermissions, useAdaptiveLayout } from '@/hooks';
import { spacing, body, caption, heading, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { VehicleImage } from '@/types';

const IMAGE_GAP = spacing.sm;
const IMAGES_PER_ROW = 3;

interface Props {
  vehicleId: string;
  images: VehicleImage[];
  onRefresh: () => void;
}

export function VehicleImagesSection({ vehicleId, images, onRefresh }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { handleError } = useErrorHandler();
  const { width: windowWidth } = useWindowDimensions();
  const { paddingHorizontal } = useAdaptiveLayout();
  const imageSize = (windowWidth - paddingHorizontal * 2 - IMAGE_GAP * (IMAGES_PER_ROW - 1)) / IMAGES_PER_ROW;
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleUpload = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      result.assets.forEach((asset, index) => {
        formData.append('images[]', {
          uri: asset.uri,
          name: asset.fileName || `image_${index}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        } as any);
      });

      await adminApi.uploadVehicleImages(vehicleId, formData);
      Alert.alert('Sucesso', `${result.assets.length} imagem(ns) enviada(s).`);
      onRefresh();
    } catch (error) {
      handleError(error, 'uploadImages');
    } finally {
      setUploading(false);
    }
  }, [vehicleId, onRefresh]);

  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      setActionLoading(imageId);
      try {
        await adminApi.setPrimaryVehicleImage(vehicleId, imageId);
        onRefresh();
      } catch (error) {
        handleError(error, 'setPrimaryImage');
      } finally {
        setActionLoading(null);
      }
    },
    [vehicleId, onRefresh],
  );

  const handleDelete = useCallback(
    (imageId: string) => {
      Alert.alert('Remover Imagem', 'Deseja remover esta imagem?', [
        { text: 'Cancelar', style: 'cancel' as const },
        {
          text: 'Remover',
          style: 'destructive' as const,
          onPress: async () => {
            setActionLoading(imageId);
            try {
              await adminApi.deleteVehicleImage(vehicleId, imageId);
              onRefresh();
            } catch (error) {
              handleError(error, 'deleteImage');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]);
    },
    [vehicleId, onRefresh],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Imagens ({images.length})</Text>
        {can('vehicles.update') && (
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleUpload}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.uploadBtnText}>+ Adicionar</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {images.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma imagem adicionada</Text>
          <Text style={styles.emptyHint}>Toque em "Adicionar" para enviar fotos</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {images.map((img) => {
            const isLoading = actionLoading === img.id;
            return (
              <View key={img.id} style={[styles.imageWrapper, { width: imageSize, height: imageSize }]}>
                <FallbackImage
                  uri={img.thumbnail || img.url}
                  fallbackUri={img.url}
                  style={styles.image}
                  resizeMode="cover"
                />
                {img.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </View>
                )}
                {isLoading && (
                  <View style={styles.imageOverlay}>
                    <ActivityIndicator color={colors.white} />
                  </View>
                )}
                {can('vehicles.update') && !isLoading && (
                  <>
                    {!img.is_primary && (
                      <TouchableOpacity
                        style={styles.starBtn}
                        onPress={() => handleSetPrimary(img.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.starIcon}>★</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(img.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteBtnIcon}>✕</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
  },
  uploadBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minWidth: 90,
    alignItems: 'center' as const,
  },
  uploadBtnText: {
    ...caption.md,
    fontWeight: '600' as const,
    color: colors.white,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
  },
  emptyText: {
    ...body.md,
    color: colors.textSecondary,
  },
  emptyHint: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: IMAGE_GAP,
  },
  imageWrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden' as const,
    backgroundColor: colors.gray100,
  },
  image: {
    width: '100%' as const,
    height: '100%' as const,
  },
  primaryBadge: {
    position: 'absolute' as const,
    top: 4,
    left: 4,
    backgroundColor: colors.warning,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.white,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  starBtn: {
    position: 'absolute' as const,
    top: 4,
    left: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  starIcon: {
    fontSize: 14,
    color: colors.warning,
  },
  deleteBtn: {
    position: 'absolute' as const,
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,77,79,0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  deleteBtnIcon: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
  },
});
