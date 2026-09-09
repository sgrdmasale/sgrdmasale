import React, { createContext, useContext, useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const normaliseEmail = (email) => String(email || '').trim().toLowerCase();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log('[AuthContext] Initializing auth state...');
      try {
        if (!pb.authStore.isValid) {
          console.log('[AuthContext] No valid auth store found.');
          return;
        }

        const user = pb.authStore.model;
        if (!user) {
          pb.authStore.clear();
          return;
        }

        // Do not query admin_settings from the browser. It is an admin-only
        // collection and doing so caused normal customers to receive 403s.
        const admin = user.collectionName === 'admin' || user.role === 'admin';
        if (mounted) {
          setCurrentUser(user);
          setIsAdmin(admin);
        }
        console.log(`[AuthContext] Restored ${admin ? 'admin' : 'customer'} session for:`, user.email);
      } catch (error) {
        console.error('[AuthContext] Failed to restore auth state:', error);
        pb.authStore.clear();
        if (mounted) {
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    initAuth();
    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    const identity = normaliseEmail(email);
    console.log(`[AuthContext] Attempting customer login for: ${identity}`);
    try {
      const authData = await pb.collection('users').authWithPassword(identity, password);
      const user = authData.record;
      setCurrentUser(user);
      setIsAdmin(false);
      console.log('[AuthContext] Customer login successful');
      return { success: true, user };
    } catch (error) {
      console.error('[AuthContext] Customer login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const adminLogin = async (email, password) => {
    const identity = normaliseEmail(email);
    console.log(`[AuthContext] Attempting admin login for: ${identity}`);
    try {
      const authData = await pb.collection('admin').authWithPassword(identity, password);
      const user = authData.record;
      setCurrentUser(user);
      setIsAdmin(true);
      console.log('[AuthContext] Admin authentication successful');
      return { success: true, user };
    } catch (error) {
      console.error('[AuthContext] Admin login failed:', error);
      throw new Error(error.message || 'Admin login failed. Please check your credentials.');
    }
  };

  const signup = async (name, email, password, passwordConfirm) => {
    const identity = normaliseEmail(email);
    console.log(`[AuthContext] Initiating signup process for: ${identity}`);

    if (!identity || !password) throw new Error('Email and password are required.');
    if (password !== passwordConfirm) throw new Error('Passwords do not match.');

    try {
      const authData = await pb.collection('users').create({
        email: identity,
        password,
        passwordConfirm,
        name: String(name || '').trim(),
        role: 'customer',
      });

      // The Mongo API returns a token for auth collections, so do not perform
      // a second login request. This also avoids a needless race after signup.
      const user = authData?.record || authData;
      if (authData?.token && user) {
        pb.authStore.save(authData.token, user);
      }
      setCurrentUser(user);
      setIsAdmin(false);
      console.log('[AuthContext] Signup and authentication complete.');
      return { success: true, user };
    } catch (error) {
      console.error('[AuthContext] Signup failed:', error);
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = () => {
    console.log('[AuthContext] Logging out user');
    pb.authStore.clear();
    setCurrentUser(null);
    setIsAdmin(false);
  };

  // Kept as a compatibility API for screens that still expose the old
  // PocketBase password-reset action. The Mongo migration intentionally does
  // not pretend a reset succeeded when no reset endpoint exists.
  const requestPasswordReset = async () => {
    throw new Error('Password reset is not configured on the MongoDB API yet.');
  };

  const requestPasswordOtp = async () => {
    throw new Error('Password reset is not configured on the MongoDB API yet.');
  };

  const resetPasswordWithOtp = async () => {
    throw new Error('Password reset is not configured on the MongoDB API yet.');
  };

  const value = {
    currentUser,
    isAdmin,
    isAuthenticated: !!currentUser,
    login,
    adminLogin,
    signup,
    logout,
    requestPasswordReset,
    requestPasswordOtp,
    resetPasswordWithOtp,
    initialLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
