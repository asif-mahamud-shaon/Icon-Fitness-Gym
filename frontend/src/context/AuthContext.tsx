'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, Role } from '@/types';
import {
  apiFetch,
  clearApiCache,
  clearStoredAuth,
  getStoredTokens,
  setStoredTokens,
} from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: Record<string, any>) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getDefaultPortalRoute: (role?: Role) => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const USER_STORAGE_KEY = 'ifg_auth_user';

export function getPortalRouteByRole(role?: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'STAFF':
      return '/admin/dashboard';
    case 'TRAINER':
      return '/trainer/dashboard';
    case 'MEMBER':
    default:
      return '/member/dashboard';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    const { accessToken } = getStoredTokens();
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await apiFetch<any>('/auth/me');
      const normalized: AuthUser = {
        id: me.id,
        email: me.email,
        phone: me.phone,
        fullName: me.fullName,
        avatarUrl: me.avatarUrl,
        role: me.role,
        status: me.status,
        memberProfileId: me.memberProfile?.id ?? me.memberProfileId ?? null,
        memberCode: me.memberProfile?.memberCode ?? me.memberCode ?? null,
        trainerProfileId: me.trainerProfile?.id ?? me.trainerProfileId ?? null,
        trainerSlug: me.trainerProfile?.slug ?? me.trainerSlug ?? null,
        permissions: Array.isArray(me.permissions) ? me.permissions : undefined,
        permissionsConfig: me.permissionsConfig ?? null,
      };
      setUser(normalized);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
      }
    } catch {
      clearStoredAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { accessToken } = getStoredTokens();
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      if (cached && accessToken) {
        try {
          setUser(JSON.parse(cached));
          // Optimistically unlock Portal UI in 0ms while /auth/me validates in background
          setIsLoading(false);
        } catch {
          // ignore invalid json
        }
      }
    }
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    clearApiCache();
    const res = await apiFetch<{
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setStoredTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    }
    return res.user;
  };

  const register = async (payload: Record<string, any>): Promise<AuthUser> => {
    clearApiCache();
    const res = await apiFetch<{
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setStoredTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    }
    return res.user;
  };

  const logout = async () => {
    const { refreshToken } = getStoredTokens();
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // ignore network errors on logout
    }
    clearApiCache();
    clearStoredAuth();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        getDefaultPortalRoute: (r?: Role) => getPortalRouteByRole(r || user?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

