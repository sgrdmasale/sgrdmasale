import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Derive admin state from the shared PocketBase auth store and keep it in
  // sync via onChange. Reading pb.authStore directly in render isn't reactive,
  // so a login/logout that happens outside this provider (or the initial
  // restore from localStorage) could leave the UI showing the wrong state.
  useEffect(() => {
    const sync = () => {
      const record = pb.authStore.record || pb.authStore.model;
      if (pb.authStore.isValid && record?.collectionName === 'admin') {
        setAdminUser(record);
      } else {
        setAdminUser(null);
      }
    };
    sync();
    setInitialLoading(false);
    const unsubscribe = pb.authStore.onChange(sync);
    return () => unsubscribe();
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      // Trim the identity so a stray leading/trailing space from copy-paste
      // can't turn valid credentials into a "Failed to authenticate" error.
      // Password is left untouched — spaces can be legitimate there.
      const authData = await pb.collection('admin').authWithPassword(email.trim(), password, { $autoCancel: false });
      setAdminUser(authData.record);
      return { success: true, user: authData.record };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: error?.message || 'Login failed' };
    }
  };

  const logoutAdmin = () => {
    pb.authStore.clear();
    setAdminUser(null);
  };

  const isAdminAuthenticated = !!adminUser;

  return (
    <AdminAuthContext.Provider value={{ 
      adminUser, 
      loginAdmin, 
      logoutAdmin, 
      isAdminAuthenticated,
      initialLoading 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};