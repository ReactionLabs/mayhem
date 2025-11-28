import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Consolidated Sign-In Page
 * Redirects to /login for unified authentication entry point
 */
export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified login page
    router.replace('/login');
  }, [router]);

  return null;
}

