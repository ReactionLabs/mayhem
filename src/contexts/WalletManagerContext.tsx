import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useUser } from '@clerk/nextjs';

const CLERK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CLERK === 'true';

export type WalletGroup = {
  id: string;
  name: string;
  sourceWallets: string[]; // Wallet IDs
  receiverWallets: string[]; // Wallet IDs
  isActive: boolean;
};

export type ManagedWallet = {
  id: string;
  label: string;
  address: string;
  type: 'connected' | 'generated' | 'imported';
  balance: number | null;
  isActive: boolean;
  groupId?: string;
  apiKey?: string;
  privateKey?: string; // Only for generated wallets
};

type AddWalletPayload = {
  label: string;
  address: string;
  type: 'generated' | 'imported';
  apiKey?: string | null;
  privateKey?: string | null;
};

type WalletManagerContextType = {
  wallets: ManagedWallet[];
  groups: WalletGroup[];
  activeWallets: string[]; // IDs of active wallets
  addWallet: (wallet: AddWalletPayload) => Promise<string>;
  removeWallet: (id: string) => Promise<void>;
  updateWallet: (id: string, updates: Partial<ManagedWallet>) => void;
  toggleWalletActive: (id: string) => void;
  setActiveWallets: (ids: string[]) => void;
  createGroup: (group: Omit<WalletGroup, 'id'>) => string;
  updateGroup: (id: string, updates: Partial<WalletGroup>) => void;
  deleteGroup: (id: string) => void;
  consolidateGroup: (groupId: string) => void; // Move funds from source to receiver
  refreshBalances: () => Promise<void>;
};

const WalletManagerContext = createContext<WalletManagerContextType | null>(null);

export function WalletManagerProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const { isLoaded, isSignedIn } = useUser();
  const clerkReady = CLERK_ENABLED ? isLoaded : true;
  const isClerkAuthenticated = CLERK_ENABLED && isSignedIn;
  const [persistedWallets, setPersistedWallets] = useState<ManagedWallet[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<ManagedWallet | null>(null);
  const [groups, setGroups] = useState<WalletGroup[]>([]);
  const [activeWallets, setActiveWallets] = useState<string[]>([]);

  const wallets = useMemo(
    () => (connectedWallet ? [...persistedWallets, connectedWallet] : persistedWallets),
    [persistedWallets, connectedWallet]
  );

  useEffect(() => {
    if (!publicKey) {
      setConnectedWallet(null);
      return;
    }
    const address = publicKey.toBase58();
    setConnectedWallet({
      id: `connected-${address}`,
      label: 'Connected Wallet',
      address,
      type: 'connected',
      balance: null,
      isActive: true,
    });
    setActiveWallets(prev => {
      if (prev.includes(`connected-${address}`)) return prev;
      return [ `connected-${address}`, ...prev ];
    });
  }, [publicKey]);

  const mapApiWallet = useCallback(
    (wallet: any): ManagedWallet => ({
      id: wallet.id,
      label: wallet.label,
      address: wallet.address,
      type: wallet.type,
      apiKey: wallet.api_key || undefined,
      balance: wallet.balance ?? null,
      isActive: false,
    }),
    []
  );

  useEffect(() => {
    if (!clerkReady) return;

    if (!isClerkAuthenticated) {
      const savedWallets = localStorage.getItem('managed_wallets');
      const savedGroups = localStorage.getItem('wallet_groups');
      const savedActive = localStorage.getItem('active_wallets');

      if (savedWallets) {
        try {
          setPersistedWallets(JSON.parse(savedWallets));
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load wallets:', e);
          }
        }
      }

      if (savedGroups) {
        try {
          setGroups(JSON.parse(savedGroups));
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load groups:', e);
          }
        }
      }

      if (savedActive) {
        try {
          setActiveWallets(JSON.parse(savedActive));
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load active wallets:', e);
          }
        }
      }
      return;
    }

    (async () => {
      try {
        const response = await fetch('/api/wallets');
        if (!response.ok) {
          throw new Error('Failed to load wallets');
        }
        const data = await response.json();
        const mapped = (data.wallets || []).map(mapApiWallet);
        setPersistedWallets(mapped);
        if (!activeWallets.length && mapped.length) {
          setActiveWallets(mapped.slice(0, 3).map(w => w.id));
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Wallet fetch error:', error);
        }
      }
    })();
  }, [clerkReady, isClerkAuthenticated, mapApiWallet]);

  useEffect(() => {
    if (!isClerkAuthenticated) {
      localStorage.setItem('managed_wallets', JSON.stringify(persistedWallets));
      localStorage.setItem('wallet_groups', JSON.stringify(groups));
    }
  }, [persistedWallets, groups, isClerkAuthenticated]);

  useEffect(() => {
    localStorage.setItem('active_wallets', JSON.stringify(activeWallets));
  }, [activeWallets]);

  const addWallet = useCallback(
    async (wallet: AddWalletPayload): Promise<string> => {
      if (isClerkAuthenticated) {
        const response = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wallet),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Failed to add wallet');
        }
        const data = await response.json();
        const mapped = mapApiWallet(data.wallet);
        setPersistedWallets(prev => [...prev, mapped]);
        return mapped.id;
      }

      const id = `${wallet.type}-${Date.now()}`;
      const newWallet: ManagedWallet = {
        ...wallet,
        id,
        balance: null,
        isActive: false,
      };
      setPersistedWallets(prev => [...prev, newWallet]);
      return id;
    },
    [isClerkAuthenticated, mapApiWallet]
  );

  const removeWallet = useCallback(
    async (id: string) => {
      if (isClerkAuthenticated) {
        await fetch(`/api/wallets/${id}`, { method: 'DELETE' });
      }
      setPersistedWallets(prev => prev.filter(w => w.id !== id));
      setActiveWallets(prev => prev.filter(wid => wid !== id));
      setGroups(prev =>
        prev.map(g => ({
          ...g,
          sourceWallets: g.sourceWallets.filter(wid => wid !== id),
          receiverWallets: g.receiverWallets.filter(wid => wid !== id),
        }))
      );
    },
    [isClerkAuthenticated]
  );

  const updateWallet = useCallback((id: string, updates: Partial<ManagedWallet>) => {
    setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const toggleWalletActive = useCallback((id: string) => {
    setActiveWallets(prev => 
      prev.includes(id) 
        ? prev.filter(wid => wid !== id)
        : [...prev, id]
    );
  }, []);

  const createGroup = useCallback((group: Omit<WalletGroup, 'id'>): string => {
    const id = `group-${Date.now()}`;
    const newGroup: WalletGroup = { ...group, id };
    setGroups(prev => [...prev, newGroup]);
    return id;
  }, []);

  const updateGroup = useCallback((id: string, updates: Partial<WalletGroup>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  const consolidateGroup = useCallback(async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // This would trigger a consolidation transaction
    // For now, just log it - actual implementation would need transaction signing
    if (process.env.NODE_ENV === 'development') {
      console.log('Consolidating group:', group);
    }
    // TODO: Implement actual consolidation logic
  }, [groups]);

  const refreshBalances = useCallback(async () => {
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const allWallets = [...persistedWallets, ...(connectedWallet ? [connectedWallet] : [])];

    const balancePromises = allWallets.map(async (wallet) => {
      try {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [wallet.address],
          }),
        });
        
        const data = await response.json();
        return {
          id: wallet.id,
          balance: data.result?.value ? data.result.value / 1e9 : null,
        };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Failed to fetch balance for ${wallet.address}:`, error);
        }
        return { id: wallet.id, balance: null };
      }
    });

    const results = await Promise.all(balancePromises);
    setPersistedWallets(prev =>
      prev.map(w => {
        const result = results.find(r => r.id === w.id);
        return result ? { ...w, balance: result.balance } : w;
      })
    );
    if (connectedWallet) {
      const result = results.find(r => r.id === connectedWallet.id);
      if (result) {
        setConnectedWallet(prev => (prev ? { ...prev, balance: result.balance } : prev));
      }
    }
  }, [persistedWallets, connectedWallet]);

  return (
    <WalletManagerContext.Provider
      value={{
        wallets,
        groups,
        activeWallets,
        addWallet,
        removeWallet,
        updateWallet,
        toggleWalletActive,
        setActiveWallets,
        createGroup,
        updateGroup,
        deleteGroup,
        consolidateGroup,
        refreshBalances,
      }}
    >
      {children}
    </WalletManagerContext.Provider>
  );
}

export function useWalletManager() {
  const context = useContext(WalletManagerContext);
  if (!context) {
    throw new Error('useWalletManager must be used within WalletManagerProvider');
  }
  return context;
}

