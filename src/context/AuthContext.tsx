import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization, User, Role } from '../types';
import { SEED_ORGANIZATION, SEED_USERS } from '../data/seedData';

interface AuthContextType {
  user: User | null;
  organization: Organization;
  isAuthenticated: boolean;
  login: (email: string, role?: Role) => boolean;
  logout: () => void;
  switchOrganization: (org: Organization) => void;
  updateOrganization: (updates: Partial<Organization>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization>(() => {
    try {
      const stored = localStorage.getItem('sanctum_org');
      return stored ? JSON.parse(stored) : SEED_ORGANIZATION;
    } catch {
      return SEED_ORGANIZATION;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('sanctum_user');
      return stored ? JSON.parse(stored) : SEED_USERS[0]; // Default to Pastor Kenneth
    } catch {
      return SEED_USERS[0];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sanctum_org', JSON.stringify(organization));
    } catch {}
  }, [organization]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('sanctum_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('sanctum_user');
      }
    } catch {}
  }, [user]);

  const login = (email: string, _role?: Role): boolean => {
    const matchedUser = SEED_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser) {
      setUser(matchedUser);
      return true;
    }
    // Create new admin user if not found in seed
    const newUser: User = {
      id: `user_${Date.now()}`,
      organizationId: organization.id,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchOrganization = (org: Organization) => {
    setOrganization(org);
  };

  const updateOrganization = (updates: Partial<Organization>) => {
    setOrganization((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        login,
        logout,
        switchOrganization,
        updateOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
