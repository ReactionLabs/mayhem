import React, { useState } from 'react';
import { useWalletManager, ManagedWallet } from '@/contexts/WalletManagerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  CheckCircle2, 
  Circle, 
  Settings, 
  RefreshCw,
  Users,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const MultiWalletSelector: React.FC = () => {
  const {
    wallets,
    activeWallets,
    toggleWalletActive,
    setActiveWallets,
    updateWallet,
    removeWallet,
    refreshBalances,
  } = useWalletManager();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setIsRefreshing(false);
    toast.success('Balances refreshed');
  };

  const handleSelectAll = () => {
    if (activeWallets.length === wallets.length) {
      setActiveWallets([]);
    } else {
      setActiveWallets(wallets.map(w => w.id));
    }
  };

  const activeWalletsList = wallets.filter(w => activeWallets.includes(w.id));
  const totalBalance = activeWalletsList.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Trading Wallets
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {activeWallets.length} of {wallets.length} active
            {totalBalance > 0 && ` • ${totalBalance.toFixed(5)} SOL total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <WalletManagerDialog />
        </div>
      </div>

      {/* Select All */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border">
        <Checkbox
          checked={activeWallets.length === wallets.length && wallets.length > 0}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm font-medium">Select All</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {activeWallets.length} selected
        </span>
      </div>

      {/* Wallet List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {wallets.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Wallet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No wallets added</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add wallets to start trading
              </p>
            </CardContent>
          </Card>
        ) : (
          wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              isActive={activeWallets.includes(wallet.id)}
              onToggle={() => toggleWalletActive(wallet.id)}
              onUpdate={(updates) => updateWallet(wallet.id, updates)}
              onRemove={() => removeWallet(wallet.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

type WalletCardProps = {
  wallet: ManagedWallet;
  isActive: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<ManagedWallet>) => void;
  onRemove: () => Promise<void>;
};

const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  isActive,
  onToggle,
  onUpdate,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(wallet.label);

  const handleSave = () => {
    onUpdate({ label });
    setIsEditing(false);
    toast.success('Wallet label updated');
  };

  return (
    <Card className={`transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isActive}
            onCheckedChange={onToggle}
          />
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="h-7 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') {
                      setLabel(wallet.label);
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSave}>
                  Save
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <span className="font-medium text-sm">{wallet.label}</span>
                <Settings className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-muted-foreground">
                {wallet.address ? shortenAddress(wallet.address) : 'No address'}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {wallet.type}
              </Badge>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-sm font-semibold">
              {wallet.balance !== null && wallet.balance >= 0 
                ? `${wallet.balance.toFixed(5)} SOL` 
                : wallet.balance === null 
                  ? <span className="text-muted-foreground animate-pulse">Loading...</span>
                  : '0.00000 SOL'}
            </div>
            {isActive && (
              <div className="flex items-center gap-1 text-[10px] text-green-500 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={async () => {
              try {
                await onRemove();
                toast.success('Wallet archived');
              } catch (error) {
                toast.error('Failed to remove wallet');
              }
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const WalletManagerDialog: React.FC = () => {
  const { addWallet } = useWalletManager();
  const [isOpen, setIsOpen] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddWallet = async () => {
    if (!newWalletAddress.trim()) {
      toast.error('Enter a wallet address');
      return;
    }
    if (!privateKey.trim()) {
      toast.error('Private key is required');
      return;
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(newWalletAddress)) {
      toast.error('Invalid Solana address');
      return;
    }

    try {
      setIsSubmitting(true);
      await addWallet({
        label: newWalletLabel || 'Imported Wallet',
        address: newWalletAddress,
        type: 'imported',
        privateKey,
        apiKey: apiKey || null,
      });
      toast.success('Wallet saved');
      setNewWalletAddress('');
      setPrivateKey('');
      setApiKey('');
      setNewWalletLabel('');
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('https://pumpportal.fun/api/create-wallet');
      if (!response.ok) {
        throw new Error('Failed to generate wallet');
      }
      const data = await response.json();
      await addWallet({
        label: newWalletLabel || 'Lightning Wallet',
        address: data.publicKey,
        type: 'generated',
        apiKey: data.apiKey,
        privateKey: data.privateKey,
      });
      toast.success('Bot wallet generated and saved');
      setNewWalletLabel('');
      setNewWalletAddress('');
      setPrivateKey('');
      setApiKey('');
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Wallet</DialogTitle>
          <DialogDescription>
            Import a wallet by entering its public address
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Wallet Label</Label>
            <Input
              value={newWalletLabel}
              onChange={(e) => setNewWalletLabel(e.target.value)}
              placeholder="My Trading Wallet"
            />
          </div>
          <div>
            <Label>Public Address</Label>
            <Input
              value={newWalletAddress}
              onChange={(e) => setNewWalletAddress(e.target.value)}
              placeholder="Enter Solana address..."
            />
          </div>
          <div>
            <Label>Private Key</Label>
            <Input
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Base58 private key"
              type="password"
            />
          </div>
          <div>
            <Label>API Key (optional)</Label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="PumpPortal API key"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddWallet} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Import Wallet'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Bot Wallet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

