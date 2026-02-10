import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputItem, Button, Toast } from '@ant-design/react-native';
import { router } from 'expo-router';
import apiClient from '@/services/api';
import { useAdaptiveLayout } from '@/hooks';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { paddingHorizontal } = useAdaptiveLayout();

  const handleSubmit = async () => {
    if (!email.trim()) {
      Toast.info('Informe seu e-mail');
      return;
    }

    setLoading(true);
    try {
      await apiClient.forgotPassword(email.trim());
      setSubmittedEmail(email.trim());
      setSuccess(true);
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Erro ao enviar e-mail';
      Toast.fail(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setSuccess(false);
    setEmail(submittedEmail);
  };

  const renderContent = () => {
    if (success) {
      return (
        <View style={styles.card}>
          <Text style={styles.successIcon}>{'\u2709'}</Text>
          <View style={styles.spacerLg} />
          <Text style={styles.title}>Verifique seu e-mail</Text>
          <View style={styles.spacerMd} />
          <Text style={styles.subtitle}>
            Enviamos um link de recuperacao para:
          </Text>
          <View style={styles.spacerSm} />
          <Text style={styles.emailText}>{submittedEmail}</Text>
          <View style={styles.spacerMd} />
          <Text style={styles.description}>
            Verifique sua caixa de entrada e siga as instrucoes para redefinir sua
            senha. O link expira em 60 minutos.
          </Text>

          <View style={styles.spacerXl} />

          <Button type="primary" onPress={() => router.back()} style={styles.button}>
            Voltar ao Login
          </Button>

          <View style={styles.spacerLg} />

          <Pressable onPress={handleResend}>
            <Text style={styles.link}>Reenviar e-mail</Text>
          </Pressable>

          <View style={styles.spacerXl} />

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Nao recebeu o e-mail?</Text>
            <Text style={styles.helpText}>
              {'\u2022'} Verifique a pasta de spam ou lixo eletronico
            </Text>
            <Text style={styles.helpText}>
              {'\u2022'} Certifique-se de que digitou o e-mail correto
            </Text>
            <Text style={styles.helpText}>
              {'\u2022'} Tente enviar novamente
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.fallbackIcon}>
          <Text style={styles.fallbackIconText}>{'\uD83D\uDD12'}</Text>
        </View>

        <View style={styles.spacerLg} />

        <Text style={styles.title}>Esqueceu a senha?</Text>
        <View style={styles.spacerXs} />
        <Text style={styles.subtitle}>
          Sem problemas, enviaremos instrucoes de recuperacao
        </Text>

        <View style={styles.spacerXl} />

        <View style={styles.form}>
          <InputItem
            type="email-address"
            value={email}
            onChange={setEmail}
            placeholder="E-mail"
            clear
            style={styles.input}
            editable={!loading}
            autoCapitalize="none"
          />

          <View style={styles.spacerXl} />

          <Button
            type="primary"
            loading={loading}
            onPress={handleSubmit}
            style={styles.button}
          >
            Enviar Link
          </Button>

          <View style={styles.spacerLg} />

          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Voltar ao Login</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (colors: Colors) => ({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xxl,
  },
  card: {
    width: '100%' as const,
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12,
    alignItems: 'center' as const,
  },
  fallbackIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fallbackIconText: {
    fontSize: 40,
  },
  title: {
    ...heading.h2,
    color: colors.textPrimary,
    textAlign: 'center' as const,
  },
  subtitle: {
    ...body.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  description: {
    ...body.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  form: {
    width: '100%' as const,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  button: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    minHeight: 48,
  },
  link: {
    ...body.md,
    color: colors.accent,
    textAlign: 'center' as const,
  },
  successIcon: {
    fontSize: 64,
    color: colors.success,
  },
  emailText: {
    ...body.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
  },
  helpCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%' as const,
  },
  helpTitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  helpText: {
    ...body.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  spacerXs: { height: spacing.xs },
  spacerSm: { height: spacing.sm },
  spacerMd: { height: spacing.md },
  spacerLg: { height: spacing.lg },
  spacerXl: { height: spacing.xl },
});
