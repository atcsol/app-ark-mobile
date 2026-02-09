import { create } from 'zustand';
import {
  saveToken,
  getToken,
  saveUserType,
  getUserType,
  saveUserData,
  getUserData,
  clearAll,
} from '@/utils/storage';
import type { UserType } from '@/types/auth';

interface AuthState {
  token: string | null;
  userType: UserType | null;
  user: any | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  login: (token: string, userType: UserType, user: any) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: any) => void;
  setLoading: (loading: boolean) => void;
}

const extractRolesPermissions = (userType: UserType, user: any) => {
  if (userType !== 'admin' || !user) return { roles: [], permissions: [] };

  const roles = Array.isArray(user.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
    : [];

  // Permissions can come as top-level user.permissions OR nested inside roles
  const permSet = new Set<string>();

  // Direct user permissions (if any)
  if (Array.isArray(user.permissions)) {
    user.permissions.forEach((p: any) =>
      permSet.add(typeof p === 'string' ? p : p.name),
    );
  }

  // Permissions nested inside roles (Spatie pattern: roles.permissions)
  if (Array.isArray(user.roles)) {
    user.roles.forEach((role: any) => {
      if (Array.isArray(role.permissions)) {
        role.permissions.forEach((p: any) =>
          permSet.add(typeof p === 'string' ? p : p.name),
        );
      }
    });
  }

  return { roles, permissions: Array.from(permSet) };
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userType: null,
  user: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  login: async (token: string, userType: UserType, user: any) => {
    await saveToken(token);
    await saveUserType(userType);
    await saveUserData(user);

    const { roles, permissions } = extractRolesPermissions(userType, user);

    set({
      token,
      userType,
      user,
      roles,
      permissions,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    await clearAll();
    set({
      token: null,
      userType: null,
      user: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });
  },

  hydrate: async () => {
    try {
      const token = await getToken();
      const userType = (await getUserType()) as UserType | null;
      const user = await getUserData();

      if (token && userType && user) {
        const { roles, permissions } = extractRolesPermissions(userType, user);

        set({
          token,
          userType,
          user,
          roles,
          permissions,
          isAuthenticated: true,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
      set({ isHydrated: true });
    }
  },

  setUser: (user: any) => set({ user }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
