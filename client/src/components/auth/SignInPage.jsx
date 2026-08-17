import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import PageTransition from '../common/PageTransition';
import { isClerkConfigured } from '../../utils/clerk';
import { useAuth } from '../../context/AuthContext';

export default function SignInPage() {
  const hasClerk = isClerkConfigured();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <PageTransition className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Brand */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-slate-900 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span>QuizForge <span className="text-primary">AI</span></span>
        </Link>
        <p className="mt-2 text-xs text-slate-500">Sign in to your learning workspace</p>
      </div>

      {/* Clerk SignIn Component or Dev Mode Card */}
      <div className="w-full flex justify-center">
        {hasClerk ? (
          <SignIn 
            routing="path" 
            path="/sign-in" 
            signUpUrl="/sign-up" 
            fallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-lg border border-slate-200 rounded-xl bg-white',
                formButtonPrimary: 'bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm',
                headerTitle: 'text-lg font-bold text-slate-900',
                headerSubtitle: 'text-xs text-slate-500',
                socialButtonsBlockButton: 'border-slate-200 text-xs font-medium hover:bg-slate-50',
                formFieldInput: 'rounded-lg border-slate-200 text-xs focus:border-primary',
                footerActionLink: 'text-primary hover:text-primary-hover font-medium'
              }
            }}
          />
        ) : (
          <div className="w-full max-w-md p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Sign In to QuizForge AI</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Clerk integration is ready.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm block transition-colors"
            >
              Continue to Dashboard
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
