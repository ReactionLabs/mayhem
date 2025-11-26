import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { toast } from 'sonner';
import { Settings, Copy, RefreshCw, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Copyable } from '@/components/ui/Copyable';

interface WalletManagerProps {
  onApiKeyChange: (key: string | null) => void;
  currentApiKey: string | null;
}

export const WalletManager: React.FC<WalletManagerProps> = ({ onApiKeyChange, currentApiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWallet, setGeneratedWallet] = useState<{
    publicKey: string;
    privateKey: string;
    apiKey: string;
  } | null>(null);
  const [inputApiKey, setInputApiKey] = useState(currentApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);

  useEffect(() => {
    setInputApiKey(currentApiKey || '');
  }, [currentApiKey]);

  const handleGenerateWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://pumpportal.fun/api/create-wallet');
      if (!response.ok) throw new Error('Failed to generate wallet');
      
      const data = await response.json();
      setGeneratedWallet(data);
      
      setInputApiKey(data.apiKey);
      onApiKeyChange(data.apiKey);
      
      toast.success('New trading wallet generated!');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Wallet generation failed:', error);
      }
      toast.error('Failed to generate new wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = () => {
    if (inputApiKey.trim()) {
      onApiKeyChange(inputApiKey.trim());
      setIsOpen(false);
      toast.success('API Key saved');
    }
  };

  const handleClearKey = () => {
    onApiKeyChange(null);
    setInputApiKey('');
    toast.info('API Key cleared');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background border-border overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Manage Trading Wallet</DialogTitle>
          <DialogDescription>
            Configure your PumpPortal API Key or generate a new dedicated trading wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder="Enter your PumpPortal API Key"
                  className="pr-10"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleSaveKey} size="sm">Save</Button>
            </div>
            <div className="flex justify-end">
              <button onClick={handleClearKey} className="text-xs text-destructive hover:underline">
                Clear stored key
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or Generate New</span>
            </div>
          </div>

          {/* Generate Wallet Section */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Create New Trading Wallet</h4>
                <p className="text-xs text-muted-foreground">
                  Generates a fresh SOL wallet & API key for trading.
                </p>
              </div>
              <Button 
                onClick={handleGenerateWallet} 
                disabled={isLoading} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                {isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Generate
              </Button>
            </div>

            {generatedWallet && (
              <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md flex gap-3 items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-yellow-500">SAVE YOUR PRIVATE KEY NOW</p>
                    <p className="text-[10px] text-muted-foreground">
                      This is the ONLY time your private key will be shown. If you lose it, you lose access to funds in this wallet.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Public Address (Deposit SOL Here)</label>
                    <div className="flex gap-2 items-center bg-background p-2 rounded border border-input mt-1 overflow-hidden">
                      <code className="text-xs flex-1 truncate p-1">{generatedWallet.publicKey}</code>
                      <Copyable copyText={generatedWallet.publicKey} name="Address">
                        {() => <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" /></Button>}
                      </Copyable>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-destructive font-bold">Private Key (KEEP SECRET)</label>
                    <div className="flex gap-2 items-center bg-destructive/5 p-2 rounded border border-destructive/20 mt-1 overflow-hidden">
                      <code className="text-xs flex-1 truncate text-destructive break-all p-1">
                        {generatedWallet.privateKey}
                      </code>
                      <Copyable copyText={generatedWallet.privateKey} name="Private Key">
                        {() => <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-3 w-3 text-destructive hover:text-red-400" /></Button>}
                      </Copyable>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-green-500 font-bold">API Key (Auto-saved)</label>
                    <div className="flex gap-2 items-center bg-green-500/5 p-2 rounded border border-green-500/20 mt-1 overflow-hidden">
                      <div className="relative flex-1 overflow-hidden">
                        <code className="text-xs block truncate p-1 text-green-500">
                          {showGeneratedKey ? generatedWallet.apiKey : '•'.repeat(generatedWallet.apiKey.length)}
                        </code>
                      </div>
                      <button 
                        onClick={() => setShowGeneratedKey(!showGeneratedKey)}
                        className="p-1 text-green-500/70 hover:text-green-500"
                      >
                        {showGeneratedKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <Copyable copyText={generatedWallet.apiKey} name="API Key">
                        {() => <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-3 w-3 text-green-500 hover:text-green-400" /></Button>}
                      </Copyable>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
