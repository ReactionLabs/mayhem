import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useUnifiedWalletContext } from '@jup-ag/wallet-adapter';
import Header from '@/components/Header';

export default function SignUpPage() {
  const router = useRouter();
  const { setShowModal } = useUnifiedWalletContext();

  useEffect(() => {
    // Auto-open wallet modal when landing on sign-up page
    if (setShowModal) {
      setShowModal(true);
    }
  }, [setShowModal]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Get Started</h1>
          <p className="text-muted-foreground">
            Connect your Solana wallet to start trading
          </p>
          <button
            onClick={() => setShowModal?.()}
            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

