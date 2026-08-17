/**
 * Utility to check if a valid Clerk publishable key is configured
 */
export function isClerkConfigured() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.includes('placeholder') || trimmed === 'pk_test_placeholder_key') return false;
  return (trimmed.startsWith('pk_test_') || trimmed.startsWith('pk_live_')) && trimmed.length >= 25;
}

export function getClerkPublishableKey() {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  return isClerkConfigured() ? key.trim() : null;
}
