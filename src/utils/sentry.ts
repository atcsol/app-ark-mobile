import * as Sentry from '@sentry/react-native';

// Initialize Sentry
// Replace YOUR_SENTRY_DSN with the actual DSN from https://sentry.io
// Steps: 1. Create account at sentry.io (free) 2. Create project (React Native) 3. Copy DSN
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.log('[Sentry] No DSN configured, skipping initialization');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enabled: !__DEV__, // Only enable in production
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    environment: __DEV__ ? 'development' : 'production',
  });
}

// Helper to identify users in Sentry
export function setSentryUser(user: { id: string; email: string; userType: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    segment: user.userType,
  });
}

// Clear user on logout
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Capture a custom error
export function captureError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export { Sentry };
