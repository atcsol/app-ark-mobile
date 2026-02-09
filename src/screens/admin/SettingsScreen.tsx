import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button, WhiteSpace } from '@ant-design/react-native';
import * as ImagePicker from 'expo-image-picker';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen } from '@/components/ui';
import { FormInput } from '@/components/forms';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { usePermissions } from '@/hooks';

interface SettingItem {
  uuid: string;
  key: string;
  value: any;
  type: string;
  description: string;
}

interface SettingsGroup {
  group: string;
  items: SettingItem[];
}

interface CompanyLogo {
  url: string;
  filename: string;
}

const MAIL_MAILER_OPTIONS = ['log', 'smtp'];
const MAIL_ENCRYPTION_OPTIONS = ['tls', 'ssl', 'none'];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can, isSuperAdmin } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Approval & Permission toggles
  const [approvalsSettings, setApprovalsSettings] = useState<Record<string, boolean>>({});
  const [permissionsSettings, setPermissionsSettings] = useState<Record<string, boolean>>({});

  // Mail settings
  const [mailSettings, setMailSettings] = useState<Record<string, string>>({});
  const [savingMail, setSavingMail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Branding
  const [logo, setLogo] = useState<CompanyLogo | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const response = await adminApi.getSettings();
      const groups: SettingsGroup[] = (response as any).data ?? response;

      if (Array.isArray(groups)) {
        groups.forEach((group) => {
          const map: Record<string, any> = {};
          group.items.forEach((item) => {
            map[item.key] = item.value;
          });

          if (group.group === 'approvals') {
            const boolMap: Record<string, boolean> = {};
            group.items.forEach((item) => {
              boolMap[item.key] = item.value === true || item.value === 'true' || item.value === '1';
            });
            setApprovalsSettings(boolMap);
          }
          if (group.group === 'permissions') {
            const boolMap: Record<string, boolean> = {};
            group.items.forEach((item) => {
              boolMap[item.key] = item.value === true || item.value === 'true' || item.value === '1';
            });
            setPermissionsSettings(boolMap);
          }
          if (group.group === 'mail') {
            const strMap: Record<string, string> = {};
            group.items.forEach((item) => {
              strMap[item.key] = String(item.value ?? '');
            });
            setMailSettings(strMap);
          }
        });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar configuracoes';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadLogo = useCallback(async () => {
    try {
      const response = await adminApi.getCompanyLogo();
      const data = (response as any)?.data ?? response;
      if (data && data.url) {
        setLogo(data);
      }
    } catch {
      // no logo
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadLogo();
  }, [loadSettings, loadLogo]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadSettings();
    loadLogo();
  }, [loadSettings, loadLogo]);

  // --- Toggle handlers ---
  const toggleApproval = useCallback(
    async (key: string, value: boolean) => {
      const prev = { ...approvalsSettings };
      setApprovalsSettings((s) => ({ ...s, [key]: value }));
      try {
        await adminApi.updateSetting(key, value);
      } catch (err: any) {
        setApprovalsSettings(prev);
        Alert.alert('Erro', err.response?.data?.message || 'Erro ao salvar');
      }
    },
    [approvalsSettings],
  );

  const togglePermission = useCallback(
    async (key: string, value: boolean) => {
      const prev = { ...permissionsSettings };
      setPermissionsSettings((s) => ({ ...s, [key]: value }));
      try {
        await adminApi.updateSetting(key, value);
      } catch (err: any) {
        setPermissionsSettings(prev);
        Alert.alert('Erro', err.response?.data?.message || 'Erro ao salvar');
      }
    },
    [permissionsSettings],
  );

  // --- Mail handlers ---
  const updateMailField = useCallback((key: string, value: string) => {
    setMailSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveMail = useCallback(async () => {
    setSavingMail(true);
    try {
      const settings = Object.entries(mailSettings).map(([key, value]) => ({
        key,
        value,
      }));
      await adminApi.bulkUpdateSettings({ settings });
      Alert.alert('Sucesso', 'Configuracoes de email salvas.');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSavingMail(false);
    }
  }, [mailSettings]);

  const handleTestEmail = useCallback(async () => {
    if (!testEmailAddress.trim()) {
      Alert.alert('Atencao', 'Informe um email para teste.');
      return;
    }
    setTestingEmail(true);
    try {
      await adminApi.testEmail(testEmailAddress.trim());
      Alert.alert('Sucesso', `Email de teste enviado para ${testEmailAddress.trim()}.`);
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message || 'Erro ao enviar email de teste');
    } finally {
      setTestingEmail(false);
    }
  }, [testEmailAddress]);

  // --- Logo handlers ---
  const handleUploadLogo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setLogoLoading(true);
    try {
      const formData = new FormData();
      formData.append('logo', {
        uri: asset.uri,
        name: asset.fileName || 'logo.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      await adminApi.uploadCompanyLogo(formData);
      await loadLogo();
      Alert.alert('Sucesso', 'Logo atualizado.');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message || 'Erro ao enviar logo');
    } finally {
      setLogoLoading(false);
    }
  }, [loadLogo]);

  const handleDeleteLogo = useCallback(async () => {
    Alert.alert('Excluir Logo', 'Deseja remover o logo da empresa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setLogoLoading(true);
          try {
            await adminApi.deleteCompanyLogo();
            setLogo(null);
          } catch (err: any) {
            Alert.alert('Erro', err.response?.data?.message || 'Erro ao excluir logo');
          } finally {
            setLogoLoading(false);
          }
        },
      },
    ]);
  }, []);

  if (loading) {
    return <LoadingScreen message="Carregando configuracoes..." />;
  }

  const isSmtp = mailSettings['mail_mailer'] === 'smtp';

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={styles.screenTitle}>Configuracoes</Text>
      <Text style={styles.screenSubtitle}>Gerencie as configuracoes do sistema</Text>

      {/* Approvals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aprovacoes</Text>
        <Text style={styles.sectionDescription}>
          Configure quais acoes requerem aprovacao de um administrador.
        </Text>

        <View style={styles.card}>
          <SettingRow
            label="Aprovacao de Vendas"
            description="Vendas de vendedores precisam de aprovacao"
            value={approvalsSettings['seller_sale_requires_approval'] ?? false}
            onToggle={(val) => toggleApproval('seller_sale_requires_approval', val)}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Aprovacao de Servicos"
            description="Servicos de mecanicos precisam de aprovacao"
            value={approvalsSettings['mechanic_service_requires_approval'] ?? false}
            onToggle={(val) => toggleApproval('mechanic_service_requires_approval', val)}
          />
        </View>
      </View>

      {/* Permissions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissoes</Text>
        <Text style={styles.sectionDescription}>
          Configure regras de acesso e visibilidade.
        </Text>

        <View style={styles.card}>
          <SettingRow
            label="Multiplos Mecanicos por Veiculo"
            description="Permite mais de um mecanico atuar no mesmo veiculo"
            value={permissionsSettings['allow_multiple_mechanics_per_vehicle'] ?? false}
            onToggle={(val) => togglePermission('allow_multiple_mechanics_per_vehicle', val)}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Multiplos Vendedores por Veiculo"
            description="Permite mais de um vendedor atuar no mesmo veiculo"
            value={permissionsSettings['allow_multiple_sellers_per_vehicle'] ?? false}
            onToggle={(val) => togglePermission('allow_multiple_sellers_per_vehicle', val)}
          />
        </View>
      </View>

      {/* Branding Section */}
      {isSuperAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identidade Visual</Text>
          <Text style={styles.sectionDescription}>
            Logo da empresa exibido no login e em relatorios.
          </Text>

          <View style={styles.card}>
            <View style={styles.logoContainer}>
              {logoLoading ? (
                <ActivityIndicator size="large" color={colors.accent} />
              ) : logo ? (
                <Image
                  source={{ uri: logo.url }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>Sem logo</Text>
                </View>
              )}
            </View>

            {logo && (
              <Text style={styles.logoFilename}>{logo.filename}</Text>
            )}

            <WhiteSpace size="md" />

            <View style={styles.logoActions}>
              <TouchableOpacity
                style={styles.logoBtn}
                onPress={handleUploadLogo}
                disabled={logoLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.logoBtnText}>
                  {logo ? 'Trocar Logo' : 'Enviar Logo'}
                </Text>
              </TouchableOpacity>

              {logo && (
                <TouchableOpacity
                  style={[styles.logoBtn, styles.logoBtnDanger]}
                  onPress={handleDeleteLogo}
                  disabled={logoLoading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.logoBtnText, styles.logoBtnDangerText]}>Remover</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.logoHint}>JPEG, PNG ou SVG. Maximo 2MB.</Text>
          </View>
        </View>
      )}

      {/* Mail Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuracao de Email</Text>
        <Text style={styles.sectionDescription}>
          Configure o envio de emails do sistema.
        </Text>

        <View style={styles.card}>
          {/* Mail Mode */}
          <Text style={styles.fieldLabel}>Modo de Envio</Text>
          <View style={styles.optionsRow}>
            {MAIL_MAILER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionChip,
                  mailSettings['mail_mailer'] === opt && styles.optionChipActive,
                ]}
                onPress={() => updateMailField('mail_mailer', opt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    mailSettings['mail_mailer'] === opt && styles.optionChipTextActive,
                  ]}
                >
                  {opt === 'log' ? 'Log (Dev)' : 'SMTP'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isSmtp && (
            <>
              {/* Encryption */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Criptografia</Text>
              <View style={styles.optionsRow}>
                {MAIL_ENCRYPTION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.optionChip,
                      mailSettings['mail_encryption'] === opt && styles.optionChipActive,
                    ]}
                    onPress={() => updateMailField('mail_encryption', opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        mailSettings['mail_encryption'] === opt && styles.optionChipTextActive,
                      ]}
                    >
                      {opt.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <WhiteSpace size="sm" />

              <FormInput
                label="Host SMTP"
                value={mailSettings['mail_host'] || ''}
                onChangeText={(t) => updateMailField('mail_host', t)}
                placeholder="smtp.gmail.com"
                autoCapitalize="none"
              />
              <FormInput
                label="Porta"
                value={mailSettings['mail_port'] || ''}
                onChangeText={(t) => updateMailField('mail_port', t)}
                placeholder="587"
                keyboardType="number-pad"
              />
              <FormInput
                label="Usuario/Email"
                value={mailSettings['mail_username'] || ''}
                onChangeText={(t) => updateMailField('mail_username', t)}
                placeholder="seu@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <FormInput
                label="Senha"
                value={mailSettings['mail_password'] || ''}
                onChangeText={(t) => updateMailField('mail_password', t)}
                placeholder="Senha do SMTP"
                secureTextEntry
              />
            </>
          )}

          <WhiteSpace size="sm" />

          <FormInput
            label="Email Remetente"
            value={mailSettings['mail_from_address'] || ''}
            onChangeText={(t) => updateMailField('mail_from_address', t)}
            placeholder="noreply@suaempresa.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <FormInput
            label="Nome Remetente"
            value={mailSettings['mail_from_name'] || ''}
            onChangeText={(t) => updateMailField('mail_from_name', t)}
            placeholder="ARK Garage"
          />

          <WhiteSpace size="md" />

          <Button
            type="primary"
            onPress={handleSaveMail}
            loading={savingMail}
            disabled={savingMail}
            style={styles.saveBtn}
          >
            Salvar Configuracoes de Email
          </Button>

          <WhiteSpace size="lg" />
          <View style={styles.divider} />
          <WhiteSpace size="lg" />

          {/* Test Email */}
          <Text style={styles.fieldLabel}>Testar Email</Text>
          <FormInput
            label=""
            value={testEmailAddress}
            onChangeText={setTestEmailAddress}
            placeholder="email@teste.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button
            onPress={handleTestEmail}
            loading={testingEmail}
            disabled={testingEmail}
            style={styles.testBtn}
          >
            Enviar Email de Teste
          </Button>
        </View>
      </View>

      <WhiteSpace size="xl" />
    </ScreenContainer>
  );
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.white}
      />
    </View>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...body.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  settingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  settingDescription: {
    ...caption.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Branding
  logoContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 100,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  logoImage: {
    width: 200,
    height: 80,
  },
  logoPlaceholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logoPlaceholderText: {
    ...body.md,
    color: colors.textTertiary,
  },
  logoFilename: {
    ...caption.md,
    color: colors.textTertiary,
    textAlign: 'center' as const,
    marginTop: spacing.sm,
  },
  logoActions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  logoBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center' as const,
  },
  logoBtnText: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.white,
  },
  logoBtnDanger: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoBtnDangerText: {
    color: colors.error,
  },
  logoHint: {
    ...caption.sm,
    color: colors.textTertiary,
    textAlign: 'center' as const,
    marginTop: spacing.sm,
  },
  // Mail
  fieldLabel: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionsRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionChipText: {
    ...caption.md,
    color: colors.textSecondary,
  },
  optionChipTextActive: {
    color: colors.white,
  },
  saveBtn: {
    borderRadius: borderRadius.md,
  },
  testBtn: {
    borderRadius: borderRadius.md,
  },
});
