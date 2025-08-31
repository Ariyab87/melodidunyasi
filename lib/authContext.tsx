'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  triesLeft: number;
  isAdmin?: boolean; // Added isAdmin field
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  refreshCredits: () => Promise<void>;
  decrementTries: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check localStorage for existing user data
      const savedUser = localStorage.getItem('melodiUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is admin (you can modify this logic)
  const isAdmin = (email: string) => {
    const adminEmails = [
      'admin@melodidunyasi.com',
      'ariya@melodidunyasi.com',
      'negar@melodidunyasi.com',
      'test@melodidunyasi.com'
    ];
    return adminEmails.includes(email.toLowerCase());
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - in real app, validate with backend
    if (email && password) {
      const userData: User = {
        id: '1',
        name: email.split('@')[0],
        email,
        credits: isAdmin(email) ? 999 : 0, // Admins get unlimited credits
        triesLeft: isAdmin(email) ? 999 : 0, // Admins get unlimited tries
        isAdmin: isAdmin(email)
      };
      
      setUser(userData);
      localStorage.setItem('melodiUser', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    // Mock signup - in real app, create account in backend
    if (email && password && name) {
      const userData: User = {
        id: '1',
        name,
        email,
        credits: isAdmin(email) ? 999 : 0, // Admins get unlimited credits
        triesLeft: isAdmin(email) ? 999 : 0, // Admins get unlimited tries
        isAdmin: isAdmin(email)
      };
      
      setUser(userData);
      localStorage.setItem('melodiUser', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('melodiUser');
  };

  const refreshCredits = async () => {
    if (!user) return;
    
    try {
      // Mock API call to refresh credits
      // Replace with actual API call to get current user credits
      const updatedUser = { ...user, credits: user.credits };
      setUser(updatedUser);
      localStorage.setItem('melodiUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  };

  const decrementTries = () => {
    if (!user || user.triesLeft <= 0) return;
    
    const updatedUser = { ...user, triesLeft: user.triesLeft - 1 };
    setUser(updatedUser);
    localStorage.setItem('melodiUser', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshCredits,
    decrementTries,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
