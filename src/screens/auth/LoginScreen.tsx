import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputItem, Button, Toast } from '@ant-design/react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks';
import { API_BASE_URL } from '@/utils/constants';
import { spacing, heading, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface CompanyLogo {
  url: string;
  filename: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [logo, setLogo] = useState<CompanyLogo | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/company-logo`, {
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        if (data.success && data.data && data.data.url) {
          setLogo(data.data);
        }
      } catch {
        // silently fail — will show fallback icon
      } finally {
        setLogoLoading(false);
      }
    };
    fetchLogo();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.info('Preencha todos os campos');
      return;
    }

    const result = await login(email.trim(), password);

    if (result.success) {
      router.replace('/');
    } else {
      Toast.fail(result.message || 'Falha no login');
    }
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
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Card */}
            <View style={styles.card}>
              {/* Logo / Fallback */}
              <View style={styles.logoContainer}>
                {logoLoading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : logo ? (
                  <Image
                    source={{ uri: logo.url }}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.fallbackIcon}>
                    <Text style={styles.fallbackIconText}>🚗</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              {!logo && (
                <Text style={styles.brandTitle}>ARK Garage</Text>
              )}
              <Text style={styles.subtitle}>
                Faca login para acessar sua conta
              </Text>

              {/* Form */}
              <View style={styles.form}>
                <InputItem
                  type="email-address"
                  value={email}
                  onChange={setEmail}
                  placeholder="Email"
                  clear
                  style={styles.input}
                  editable={!isLoading}
                  autoCapitalize="none"
                />

                <View style={styles.fieldSpacer} />

                <InputItem
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Senha"
                  style={styles.input}
                  editable={!isLoading}
                />

                <View style={styles.buttonSpacer} />

                <Button
                  type="primary"
                  loading={isLoading}
                  onPress={handleLogin}
                  style={styles.button}
                >
                  {isLoading ? 'Verificando...' : 'Entrar'}
                </Button>

                <View style={styles.linkSpacer} />

                <Pressable onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={styles.link}>Esqueceu sua senha?</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');
const CARD_MAX_WIDTH = 420;

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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  card: {
    width: '100%' as const,
    maxWidth: CARD_MAX_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12,
  },
  logoContainer: {
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
    minHeight: 80,
    justifyContent: 'center' as const,
  },
  logoImage: {
    width: width * 0.45,
    maxWidth: 200,
    height: 80,
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
  brandTitle: {
    ...heading.h2,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...body.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: spacing.xl,
  },
  form: {
    width: '100%' as const,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldSpacer: {
    height: spacing.md,
  },
  buttonSpacer: {
    height: spacing.xl,
  },
  linkSpacer: {
    height: spacing.lg,
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
});
