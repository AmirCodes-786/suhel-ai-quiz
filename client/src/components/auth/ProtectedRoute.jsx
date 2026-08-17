import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLoadingScreen from './AuthLoadingScreen';
import PageTransition from '../common/PageTransition';

/**
 * Bulletproof ProtectedRoute:
 * - Checks persistent authentication state
 * - Never gets stuck in redirect loops or causes unexpected logouts on refresh
 */
export default function ProtectedRoute({ children }) {
  const { user, isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <AuthLoadingScreen />;
  }

  // Only redirect if genuinely logged out
  if (!isSignedIn || !user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <PageTransition>{children}</PageTransition>;
}
