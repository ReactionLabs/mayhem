import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { sendExtensionCommand, getExtensionToken, isExtensionInstalled } from '@/lib/extension-bridge';
import { Zap, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ExtensionBridge = () => {
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [extensionToken, setExtensionToken] = useState<any>(null);

  useEffect(() => {
    // Check if extension is installed
    checkExtension();
    
    // Listen for extension messages
    const listener = (event: MessageEvent) => {
      if (event.data?.type === 'mayhem-token-response') {
        setExtensionToken(event.data.token);
      } else if (event.data?.type === 'mayhem-command-response') {
        if (event.data.error) {
          toast.error(`Extension: ${event.data.error}`);
        } else {
          toast.success('Extension command executed');
        }
      }
    };
    
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  const checkExtension = async () => {
    // Check if extension is installed by looking for window.MayhemAutomation
    // This is set by the extension's content script
    const hasExtension = typeof window !== 'undefined' && (window as any).MayhemAutomation;
    setExtensionInstalled(hasExtension);
    
    // Also try to get token from extension
    if (hasExtension) {
      const token = await getExtensionToken();
      if (token) {
        setExtensionToken(token);
      }
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!extensionInstalled) {
      toast.error('Extension not detected. Please install the Mayhem extension.');
      return;
    }

    try {
      switch (action) {
        case 'open-token':
          if (extensionToken?.ca) {
            await sendExtensionCommand({
              type: 'navigate',
              url: `https://pump.fun/${extensionToken.ca}`,
            });
            toast.success('Opening token in Pump.fun...');
          }
          break;
        case 'copy-ca':
          if (extensionToken?.ca) {
            await navigator.clipboard.writeText(extensionToken.ca);
            toast.success('Contract address copied!');
          }
          break;
      }
    } catch (error) {
      toast.error('Failed to communicate with extension');
    }
  };

  if (!extensionInstalled) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Extension Not Detected</p>
            <p className="text-xs text-muted-foreground">
              Install the Mayhem extension for enhanced features
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <CheckCircle className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Extension Connected</p>
          {extensionToken && (
            <p className="text-xs text-muted-foreground">
              Token: {extensionToken.symbol || extensionToken.ca?.slice(0, 8)}...
            </p>
          )}
        </div>
      </div>
      
      {extensionToken && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickAction('open-token')}
            className="flex-1"
          >
            <Zap className="h-3 w-3 mr-1" />
            Open in Pump.fun
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickAction('copy-ca')}
            className="flex-1"
          >
            Copy CA
          </Button>
        </div>
      )}
    </div>
  );
};

