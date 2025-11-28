import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Consolidated Sign-Up Page
 * Redirects to /login for unified authentication entry point
 * Jupiter's Unified Wallet Adapter handles both new and existing users
 */
export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified login page
    router.replace('/login');
  }, [router]);

  return null;
}

