import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { isClerkConfigured, getClerkPublishableKey } from './utils/clerk';
import './index.css';
import App from './App.jsx';

const clerkKey = getClerkPublishableKey();
const hasClerk = isClerkConfigured();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {hasClerk ? (
      <ClerkProvider
        publishableKey={clerkKey}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);
