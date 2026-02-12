import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/services/api';
import { ApiError } from '@/utils/apiError';
import type { UserType } from '@/types/auth';

export function useAuth() {
  const {
    token,
    userType,
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    login: storeLogin,
    logout: storeLogout,
    setLoading,
  } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // Use unified-login to authenticate all user types in one call
      const response = await apiClient.unifiedLogin(email, password);

      if (!response.success) {
        throw new Error(response.message || 'Falha no login');
      }

      const type = response.data.user_type as UserType;
      let authToken: string;
      let userData: any;

      switch (type) {
        case 'admin':
          authToken = response.data.access_token;
          userData = response.data.user;
          break;
        case 'seller':
          authToken = response.data.token || response.data.access_token;
          userData = response.data.seller;
          break;
        case 'mechanic':
          authToken = response.data.token || response.data.access_token;
          userData = response.data.mechanic;
          break;
        case 'investor':
          authToken = response.data.token || response.data.access_token;
          userData = response.data.investor || response.data;
          break;
        default:
          throw new Error('Tipo de usuário desconhecido');
      }

      if (!authToken) {
        throw new Error('Token de autenticação não recebido');
      }

      if (__DEV__) {
        console.log('[Auth] Token extracted:', {
          type,
          tokenLength: authToken.length,
          tokenPreview: `${authToken.substring(0, 15)}...`,
          hasUserData: !!userData,
          userRoles: userData?.roles?.map((r: any) => typeof r === 'string' ? r : r.name),
        });
      }

      await storeLogin(authToken, type, userData);

      // For admin, verify the token works by calling /auth/me
      // This is the same pattern used by the web frontend (refreshUser)
      if (type === 'admin') {
        try {
          const meResponse = await apiClient.getMe();
          const freshUser = meResponse.data?.user || meResponse.data;
          if (freshUser) {
            if (__DEV__) {
              console.log('[Auth] /auth/me verified OK:', {
                userId: freshUser.id,
                email: freshUser.email,
                roles: freshUser.roles?.map((r: any) => r.name),
                permissionsCount: freshUser.roles?.reduce(
                  (acc: number, r: any) => acc + (r.permissions?.length || 0), 0
                ),
              });
            }
            // Update user data with fresh data from /auth/me (includes roles.permissions)
            await storeLogin(authToken, type, freshUser);
          }
        } catch (meErr) {
          if (__DEV__) {
            console.log('[Auth] /auth/me verification failed:', meErr);
          }
          // If /auth/me fails, the token is likely invalid
          // Still proceed - the user will see errors on the dashboard
        }
      }

      return { success: true, userType: type };
    } catch (error) {
      setLoading(false);
      if (__DEV__) {
        console.log('[Auth] Login error:', error);
      }
      const apiError = ApiError.fromError(error);
      return { success: false, message: apiError.userMessage };
    }
  }, [storeLogin, setLoading]);

  const logout = useCallback(async () => {
    try {
      const logoutEndpoints: Record<string, string> = {
        admin: '/auth/logout',
        seller: '/seller/logout',
        mechanic: '/mechanic/logout',
        investor: '/investor/logout',
      };
      if (userType && logoutEndpoints[userType]) {
        await apiClient.post(logoutEndpoints[userType]);
      }
    } catch {
      // Ignore logout API errors
    } finally {
      await storeLogout();
    }
  }, [userType, storeLogout]);

  return {
    token,
    userType,
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    login,
    logout,
  };
}
