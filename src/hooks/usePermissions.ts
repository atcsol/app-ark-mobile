import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function usePermissions() {
  const { roles, permissions, userType } = useAuthStore();

  const hasRole = useCallback(
    (role: string): boolean => {
      if (userType !== 'admin') return false;
      return roles.includes(role);
    },
    [roles, userType],
  );

  const can = useCallback(
    (permission: string): boolean => {
      if (userType !== 'admin') return false;
      if (roles.includes('super-admin')) return true;
      return permissions.includes(permission);
    },
    [roles, permissions, userType],
  );

  const canAny = useCallback(
    (perms: string[]): boolean => {
      if (userType !== 'admin') return false;
      if (roles.includes('super-admin')) return true;
      return perms.some((p) => permissions.includes(p));
    },
    [roles, permissions, userType],
  );

  const isSuperAdmin = roles.includes('super-admin');

  return { hasRole, can, canAny, isSuperAdmin };
}
