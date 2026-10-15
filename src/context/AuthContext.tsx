import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';
import { Organization, User, Role } from '../types';
import { SEED_ORGANIZATION } from '../data/seedData';
import { setCmsAccessTokenGetter } from '../services/api/cmsApi';
import { ApiClientError, sanctumApi, setApiAccessTokenGetter } from '../services/api/sanctumApi';

interface AuthContextType {
  user: User | null;
  organization: Organization;
  isAuthenticated: boolean;
  authReady: boolean;
  membershipDenied: boolean;
  needsOnboarding: boolean;
  clerkConfigured: boolean;
  login: (email: string, role?: Role) => boolean;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  switchOrganization: (org: Organization) => void;
  updateOrganization: (updates: Partial<Organization>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapOrganization(row: Record<string, unknown> | null): Organization {
  if (!row) return SEED_ORGANIZATION;
  return {
    ...SEED_ORGANIZATION,
    id: String(row.id || SEED_ORGANIZATION.id),
    name: typeof row.name === 'string' ? row.name : '',
    slug: String(row.slug || SEED_ORGANIZATION.slug),
    logoUrl: typeof row.logoUrl === 'string' ? row.logoUrl : undefined,
    country: String(row.country || SEED_ORGANIZATION.country),
    timezone: String(row.timezone || SEED_ORGANIZATION.timezone),
    website: typeof row.website === 'string' ? row.website : SEED_ORGANIZATION.website,
    joinPageMessage:
      typeof row.joinPageMessage === 'string' ? row.joinPageMessage : SEED_ORGANIZATION.joinPageMessage,
    accentColor: typeof row.accentColor === 'string' ? row.accentColor : SEED_ORGANIZATION.accentColor,
    youtubeChannelId: typeof row.youtubeChannelId === 'string' ? row.youtubeChannelId : undefined,
    youtubeChannelInput: typeof row.youtubeChannelInput === 'string' ? row.youtubeChannelInput : undefined,
    defaultSermonSpeaker: typeof row.defaultSermonSpeaker === 'string' ? row.defaultSermonSpeaker : 'Pastor GraceLove Hiire',
    speakerAliases: Array.isArray(row.speakerAliases) ? row.speakerAliases.filter((alias): alias is string => typeof alias === 'string') : [],
  };
}

function asKnownRole(role: unknown): Role {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
    case 'PRAYER_LEADER':
    case 'TECHNICAL_ADMIN':
    case 'MEDIA':
    case 'SPEAKER':
    case 'LISTENER':
      return role;
    default:
      return 'LISTENER';
  }
}

const ClerkSyncedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const [organization, setOrganization] = useState<Organization>(SEED_ORGANIZATION);
  const [user, setUser] = useState<User | null>(null);
  const [membershipDenied, setMembershipDenied] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setApiAccessTokenGetter(() => getToken());
    setCmsAccessTokenGetter(() => getToken());
    return () => {
      setApiAccessTokenGetter(null);
      setCmsAccessTokenGetter(null);
    };
  }, [getToken]);

  const applyMe = useCallback((me: Awaited<ReturnType<typeof sanctumApi.fetchMe>>) => {
    if (me.needsOnboarding || !me.user?.role || !me.user.organizationId || !me.organization) {
      setUser(null);
      setNeedsOnboarding(true);
      setMembershipDenied(false);
      return;
    }
    setNeedsOnboarding(false);
    setMembershipDenied(false);
    setUser({
      id: me.user.id,
      organizationId: me.user.organizationId,
      name: me.user.name,
      memberName: me.user.memberName || undefined,
      email: me.user.email,
      role: asKnownRole(me.user.role),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setOrganization(mapOrganization(me.organization));
  }, []);

  const syncFromClerk = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setUser(null);
      setMembershipDenied(false);
      setNeedsOnboarding(false);
      setAuthReady(true);
      return;
    }
    try {
      let token = await getToken();
      for (let attempt = 0; !token && attempt < 8; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        token = await getToken();
      }
      if (!token) {
        setUser(null);
        setMembershipDenied(false);
        setNeedsOnboarding(false);
        setAuthReady(true);
        return;
      }
      const me = await sanctumApi.fetchMe();
      applyMe(me);
    } catch (error) {
      setUser(null);
      setNeedsOnboarding(false);
      setMembershipDenied(error instanceof ApiClientError && error.status === 403);
    } finally {
      setAuthReady(true);
    }
  }, [applyMe, getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await syncFromClerk();
      if (cancelled) return;
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [syncFromClerk]);

  const logout = () => {
    setUser(null);
    setNeedsOnboarding(false);
    void signOut({ redirectUrl: '/' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: Boolean(user),
        authReady,
        membershipDenied,
        needsOnboarding,
        clerkConfigured: true,
        login: () => false,
        logout,
        refreshAuth: syncFromClerk,
        switchOrganization: setOrganization,
        updateOrganization: (updates) =>
          setOrganization((prev) => ({ ...prev, ...updates, updatedAt: new Date().toISOString() })),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const LocalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization>(SEED_ORGANIZATION);
  return (
    <AuthContext.Provider
      value={{
        user: null,
        organization,
        isAuthenticated: false,
        authReady: true,
        membershipDenied: false,
        needsOnboarding: false,
        clerkConfigured: false,
        login: () => false,
        logout: () => undefined,
        refreshAuth: async () => undefined,
        switchOrganization: setOrganization,
        updateOrganization: (updates) =>
          setOrganization((prev) => ({ ...prev, ...updates, updatedAt: new Date().toISOString() })),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return <LocalAuthProvider>{children}</LocalAuthProvider>;
  }
  return <ClerkSyncedAuthProvider>{children}</ClerkSyncedAuthProvider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
