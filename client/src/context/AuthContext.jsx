import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { isClerkConfigured } from '../utils/clerk';

const AuthContext = createContext(null);

function ClerkUserSync({ onSyncUser, onSetSignOut }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    if (onSetSignOut && signOut) {
      onSetSignOut(() => signOut);
    }
  }, [signOut, onSetSignOut]);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      const synced = {
        _id: clerkUser.id,
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || (clerkUser.primaryEmailAddress?.emailAddress ? clerkUser.primaryEmailAddress.emailAddress.split('@')[0] : 'User'),
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        avatar: clerkUser.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: clerkUser.publicMetadata?.role || 'student',
        plan: clerkUser.publicMetadata?.plan || 'pro',
        stats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0, streakDays: 0 }
      };
      onSyncUser(synced);

      getToken().then((token) => {
        if (token) {
          localStorage.setItem('quizforge_token', token);
        }
      }).catch(() => {});
    }
  }, [isLoaded, isSignedIn, clerkUser, getToken, onSyncUser]);

  return null;
}

export function AuthProvider({ children }) {
  const hasClerk = isClerkConfigured();
  const [clerkSignOutFn, setClerkSignOutFn] = useState(null);

  // 1. Initialize user from localStorage, fallback to active session
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('quizforge_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [isSignedIn, setIsSignedIn] = useState(() => {
    try {
      return !!localStorage.getItem('quizforge_user');
    } catch (e) {
      return false;
    }
  });
  const [isLoaded, setIsLoaded] = useState(true);

  // Save whenever user object changes
  const handleSyncUser = useCallback((syncedUser) => {
    if (syncedUser) {
      setUser(syncedUser);
      setIsSignedIn(true);
      try {
        localStorage.setItem('quizforge_user', JSON.stringify(syncedUser));
      } catch (e) {}
    }
  }, []);

  const handleSetSignOut = useCallback((fnWrapper) => {
    setClerkSignOutFn(fnWrapper);
  }, []);

  // Explicit user logout
  const logout = async () => {
    try {
      if (typeof clerkSignOutFn === 'function') {
        await clerkSignOutFn();
      }
    } catch (e) {
      console.warn('SignOut warning:', e);
    } finally {
      localStorage.removeItem('quizforge_token');
      localStorage.removeItem('quizforge_user');
      setUser(null);
      setIsSignedIn(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      logout, 
      hasClerk,
      isSignedIn,
      isLoaded
    }}>
      {hasClerk && (
        <ClerkUserSync 
          onSyncUser={handleSyncUser} 
          onSetSignOut={handleSetSignOut}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
