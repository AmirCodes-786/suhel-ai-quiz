import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import { ToastProvider } from './context/ToastContext';

// Layout
import AppShell from './components/layout/AppShell';

// Auth Guards
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy-Loaded Views for High-Performance Code Splitting & Fast First Contentful Paint
const SignInPage = lazy(() => import('./components/auth/SignInPage'));
const SignUpPage = lazy(() => import('./components/auth/SignUpPage'));
const LandingPage = lazy(() => import('./components/landing/LandingPage'));
const DashboardOverview = lazy(() => import('./components/dashboard/DashboardOverview'));
const AIQuizGeneratorStudio = lazy(() => import('./components/generator/AIQuizGeneratorStudio'));
const QuizLibraryView = lazy(() => import('./components/quizzes/QuizLibraryView'));
const QuizPlayerView = lazy(() => import('./components/player/QuizPlayerView'));
const FlashcardStudio = lazy(() => import('./components/flashcards/FlashcardStudio'));
const BattleArena = lazy(() => import('./components/battle/BattleArena'));
const CertificateView = lazy(() => import('./components/certificates/CertificateView'));
const PublicVerifyPage = lazy(() => import('./components/certificates/PublicVerifyPage'));
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const SettingsView = lazy(() => import('./components/settings/SettingsView'));

function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20 min-h-[300px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SoundProvider>
          <ToastProvider>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* Public Authentication & Verification Routes */}
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/verify/:code" element={<PublicVerifyPage />} />
                <Route path="/verify" element={<Navigate to="/certificates" replace />} />

                {/* Main Application Routes */}
                <Route path="/" element={<AppShell />}>
                  {/* Public Landing Page */}
                  <Route index element={<LandingPage />} />

                  {/* Protected Application Routes */}
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardOverview />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="ai-studio"
                    element={
                      <ProtectedRoute>
                        <AIQuizGeneratorStudio />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="generator" element={<Navigate to="/ai-studio" replace />} />
                  
                  <Route
                    path="library"
                    element={
                      <ProtectedRoute>
                        <QuizLibraryView />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="quizzes" element={<Navigate to="/library" replace />} />

                  <Route
                    path="quiz/:id"
                    element={
                      <ProtectedRoute>
                        <QuizPlayerView />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="flashcards"
                    element={
                      <ProtectedRoute>
                        <FlashcardStudio />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="battles"
                    element={
                      <ProtectedRoute>
                        <BattleArena />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="battle" element={<Navigate to="/battles" replace />} />

                  <Route
                    path="certificates"
                    element={
                      <ProtectedRoute>
                        <CertificateView />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="certificate" element={<Navigate to="/certificates" replace />} />

                  <Route
                    path="analytics"
                    element={
                      <ProtectedRoute>
                        <AnalyticsDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="settings"
                    element={
                      <ProtectedRoute>
                        <SettingsView />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </SoundProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
