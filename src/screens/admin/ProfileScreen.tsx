import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button, WhiteSpace } from '@ant-design/react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '@/hooks';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/services/api';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { Avatar } from '@/components/ui';
import { FormInput } from '@/components/forms';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

export default function AdminProfileScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { user, logout } = useAuth();
  const { handleError } = useErrorHandler();

  // Edit profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar?.url || null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Sync user data when it changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar?.url || null);
    }
  }, [user]);

  // --- Roles extraction ---
  const roles: string[] = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
    : [];

  // --- Member since ---
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // --- Avatar Upload ---
  const handleUploadAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        name: asset.fileName || 'avatar.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const response = await adminApi.uploadAvatar(formData);
      const newUrl = response?.avatar?.url || response?.url || asset.uri;
      setAvatarUrl(newUrl);

      // Update user in auth store
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          avatar: { url: newUrl },
        });
      }

      Alert.alert('Sucesso', 'Foto de perfil atualizada.');
    } catch (error) {
      handleError(error, 'uploadAvatar');
    } finally {
      setAvatarLoading(false);
    }
  }, [handleError]);

  const handleDeleteAvatar = useCallback(() => {
    Alert.alert('Remover Foto', 'Deseja remover sua foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setAvatarLoading(true);
          try {
            await adminApi.deleteAvatar();
            setAvatarUrl(null);

            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              useAuthStore.getState().setUser({
                ...currentUser,
                avatar: null,
              });
            }
          } catch (error) {
            handleError(error, 'deleteAvatar');
          } finally {
            setAvatarLoading(false);
          }
        },
      },
    ]);
  }, []);

  // --- Save Profile ---
  const handleSaveProfile = useCallback(async () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Nome e obrigatorio';
    if (!email.trim()) errors.email = 'Email e obrigatorio';

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setProfileLoading(true);

    try {
      const response = await apiClient.put('/auth/profile', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      });

      const updatedUser = response?.user || response || { ...user, name: name.trim(), email: email.trim(), phone: phone.trim() };
      useAuthStore.getState().setUser(updatedUser);

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    } catch (error) {
      handleError(error, 'saveProfile');
    } finally {
      setProfileLoading(false);
    }
  }, [name, email, phone, user, handleError]);

  // --- Change Password ---
  const handleChangePassword = useCallback(async () => {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = 'Senha atual e obrigatoria';
    if (!newPassword) errors.newPassword = 'Nova senha e obrigatoria';
    else if (newPassword.length < 8) errors.newPassword = 'Minimo de 8 caracteres';
    if (!confirmPassword) errors.confirmPassword = 'Confirmacao e obrigatoria';
    else if (confirmPassword !== newPassword) errors.confirmPassword = 'As senhas nao coincidem';

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setPasswordLoading(true);

    try {
      await apiClient.put('/auth/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Sucesso', 'Senha alterada com sucesso.');
    } catch (error) {
      handleError(error, 'changePassword');
    } finally {
      setPasswordLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, handleError]);

  // --- Logout ---
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ],
    );
  }, [logout]);

  return (
    <ScreenContainer>
      {/* Section 1: Avatar + User Info */}
      <View style={styles.card}>
        <View style={styles.userInfoContainer}>
          {/* Avatar with upload */}
          <TouchableOpacity onPress={handleUploadAvatar} disabled={avatarLoading} activeOpacity={0.7}>
            {avatarLoading ? (
              <View style={styles.avatarLoadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Avatar name={user?.name || 'Admin'} size={90} />
            )}
          </TouchableOpacity>

          <View style={styles.avatarActions}>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={handleUploadAvatar}
              disabled={avatarLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarBtnText}>
                {avatarUrl ? 'Trocar Foto' : 'Adicionar Foto'}
              </Text>
            </TouchableOpacity>

            {avatarUrl && (
              <TouchableOpacity
                style={[styles.avatarBtn, styles.avatarBtnDanger]}
                onPress={handleDeleteAvatar}
                disabled={avatarLoading}
                activeOpacity={0.7}
              >
                <Text style={[styles.avatarBtnText, styles.avatarBtnDangerText]}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.avatarHint}>JPG ou PNG. Maximo 2MB.</Text>

          <WhiteSpace size="md" />

          <Text style={styles.userName}>{user?.name || 'Administrador'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          {roles.length > 0 && (
            <View style={styles.rolesRow}>
              {roles.map((role) => (
                <View key={role} style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{role}</Text>
                </View>
              ))}
            </View>
          )}

          {memberSince && (
            <Text style={styles.memberSince}>Membro desde {memberSince}</Text>
          )}
        </View>
      </View>

      <WhiteSpace size="lg" />

      {/* Section 2: Edit Profile Form */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Editar Perfil</Text>
        <WhiteSpace size="md" />

        <FormInput
          label="Nome"
          required
          value={name}
          onChangeText={setName}
          placeholder="Seu nome completo"
          error={profileErrors.name}
          autoCapitalize="words"
        />

        <FormInput
          label="Email"
          required
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          error={profileErrors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormInput
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          placeholder="(00) 00000-0000"
          error={profileErrors.phone}
          keyboardType="phone-pad"
        />

        <Button
          type="primary"
          onPress={handleSaveProfile}
          loading={profileLoading}
          disabled={profileLoading}
        >
          Salvar Perfil
        </Button>
      </View>

      <WhiteSpace size="lg" />

      {/* Section 3: Change Password Form */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alterar Senha</Text>
        <WhiteSpace size="md" />

        <FormInput
          label="Senha Atual"
          required
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Digite sua senha atual"
          error={passwordErrors.currentPassword}
          secureTextEntry
        />

        <FormInput
          label="Nova Senha"
          required
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Minimo de 8 caracteres"
          error={passwordErrors.newPassword}
          secureTextEntry
        />

        <FormInput
          label="Confirmar Nova Senha"
          required
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repita a nova senha"
          error={passwordErrors.confirmPassword}
          secureTextEntry
        />

        <Button
          type="primary"
          onPress={handleChangePassword}
          loading={passwordLoading}
          disabled={passwordLoading}
        >
          Alterar Senha
        </Button>
      </View>

      <WhiteSpace size="lg" />

      {/* Section 4: Logout */}
      <View style={styles.card}>
        <Button
          type="warning"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Sair da Conta
        </Button>
      </View>

      <WhiteSpace size="xl" />

      <Text style={styles.version}>ARK Garage v1.0.0</Text>

      <WhiteSpace size="lg" />
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfoContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
  },
  // Avatar
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.accent + '30',
  },
  avatarLoadingContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarActions: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  avatarBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
  },
  avatarBtnText: {
    ...caption.md,
    fontWeight: '600' as const,
    color: colors.white,
  },
  avatarBtnDanger: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
  },
  avatarBtnDangerText: {
    color: colors.error,
  },
  avatarHint: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  // User info
  userName: {
    ...heading.h3,
    color: colors.textPrimary,
    textAlign: 'center' as const,
  },
  userEmail: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  rolesRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  roleTag: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleTagText: {
    ...caption.md,
    color: colors.accent,
    fontWeight: '600' as const,
  },
  memberSince: {
    ...body.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
  },
  logoutButton: {
    borderColor: colors.error,
  },
  version: {
    ...body.sm,
    color: colors.textTertiary,
    textAlign: 'center' as const,
  },
});
