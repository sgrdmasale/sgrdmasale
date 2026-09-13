import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const sync = (token = pb.authStore.token, record = pb.authStore.record) => {
      if (token && record?.collectionName === 'admin') {
        setAdminUser(record);
        console.log('[AuthContext] Restored admin session for:', record.email);
      } else {
        setAdminUser(null);
      }
    };

    // Restore MongoDB/JWT session from localStorage.
    sync();

    setInitialLoading(false);

    // Keep React state synchronized with the MongoDB auth store.
    const unsubscribe = pb.authStore.onChange((token, record) => {
      sync(token, record);
    });

    return () => unsubscribe();
  }, []);

  const loginAdmin = async (email, password) => {
    try {
      const authData = await pb
        .collection('admin')
        .authWithPassword(
          email.trim(),
          password,
          { $autoCancel: false }
        );

      if (
        !authData?.record ||
        authData.record.collectionName !== 'admin'
      ) {
        pb.authStore.clear();

        return {
          success: false,
          error: 'Authenticated account is not an admin account.'
        };
      }

      setAdminUser(authData.record);

      console.log(
        '[AuthContext] Admin login successful:',
        authData.record.email
      );

      return {
        success: true,
        user: authData.record
      };
    } catch (error) {
      console.error('[AuthContext] Admin login error:', error);

      return {
        success: false,
        error: error?.message || 'Login failed'
      };
    }
  };

  const logoutAdmin = () => {
    pb.authStore.clear();
    setAdminUser(null);

    console.log('[AuthContext] Admin logged out');
  };

  const isAdminAuthenticated =
    Boolean(adminUser) &&
    adminUser?.collectionName === 'admin' &&
    pb.authStore.isValid;

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loginAdmin,
        logoutAdmin,
        isAdminAuthenticated,
        initialLoading
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      'useAdminAuth must be used within AdminAuthProvider'
    );
  }

  return context;
};