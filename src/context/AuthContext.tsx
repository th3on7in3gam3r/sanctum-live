import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';
import { Organization, User, Role } from '../types';
import { SEED_ORGANIZATION } from '../data/seedData';
import { ApiClientError, sanctumApi, setApiAccessTokenGetter } from '../services/api/sanctumApi';

interface AuthContextType {
  user: User | null;
  organization: Organization;
  isAuthenticated: boolean;
  authReady: boolean;
  membershipDenied: boolean;
  clerkConfigured: boolean;
  login: (email: string, role?: Role) => boolean;
  logout: () => void;
  switchOrganization: (org: Organization) => void;
  updateOrganization: (updates: Partial<Organization>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapOrganization(row: Record<string, unknown> | null): Organization {
  if (!row) return SEED_ORGANIZATION;
  return {
    ...SEED_ORGANIZATION,
    id: String(row.id || SEED_ORGANIZATION.id),
    name: String(row.name || SEED_ORGANIZATION.name),
    slug: String(row.slug || SEED_ORGANIZATION.slug),
    country: String(row.country || SEED_ORGANIZATION.country),
    timezone: String(row.timezone || SEED_ORGANIZATION.timezone),
    website: typeof row.website === 'string' ? row.website : SEED_ORGANIZATION.website,
    joinPageMessage:
      typeof row.joinPageMessage === 'string' ? row.joinPageMessage : SEED_ORGANIZATION.joinPageMessage,
  };
}

const ClerkSyncedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const [organization, setOrganization] = useState<Organization>(SEED_ORGANIZATION);
  const [user, setUser] = useState<User | null>(null);
  const [membershipDenied, setMembershipDenied] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setApiAccessTokenGetter(() => getToken());
    return () => setApiAccessTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (!isLoaded) return;
      if (!isSignedIn) {
        if (!cancelled) {
          setUser(null);
          setMembershipDenied(false);
          setAuthReady(true);
        }
        return;
      }
      try {
        let token = await getToken();
        for (let attempt = 0; !token && attempt < 8; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          if (cancelled) return;
          token = await getToken();
        }
        if (!token) {
          if (!cancelled) {
            setUser(null);
            setMembershipDenied(false);
            setAuthReady(true);
          }
          return;
        }
        const me = await sanctumApi.fetchMe();
        if (cancelled) return;
        setMembershipDenied(false);
        setUser({
          id: me.user.id,
          organizationId: me.user.organizationId,
          name: me.user.name,
          email: me.user.email,
          role: me.user.role as Role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setOrganization(mapOrganization(me.organization));
      } catch (error) {
        if (cancelled) return;
        setUser(null);
        setMembershipDenied(error instanceof ApiClientError && error.status === 403);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const logout = () => {
    setUser(null);
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
        clerkConfigured: true,
        login: () => false,
        logout,
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
        clerkConfigured: false,
        login: () => false,
        logout: () => undefined,
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
