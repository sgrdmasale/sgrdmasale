import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, initialLoading } = useAuth();
  const location = useLocation();

  console.log(`[ProtectedRoute] Evaluating access for path: ${location.pathname}`);
  console.log(`[ProtectedRoute] State -> Loading: ${initialLoading}, Auth: ${isAuthenticated}, AdminRequired: ${adminOnly}, IsAdmin: ${isAdmin}`);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] User not authenticated. Redirecting to login.');
    // Redirect to admin login if trying to access admin routes
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log('[ProtectedRoute] User authenticated but lacks admin privileges. Redirecting to home.');
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] Access granted. Rendering children.');
  return children;
};

export default ProtectedRoute;