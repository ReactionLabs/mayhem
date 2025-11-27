import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Copy, ExternalLink, Info } from 'lucide-react';
import { env } from '@/config/env';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';

export const CommunityWalletInfo = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  const openInExplorer = () => {
    window.open(`https://solscan.io/account/${env.communityWallet}`, '_blank');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Community Wallet
        </CardTitle>
        <CardDescription>
          All platform fees go to this community treasury
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fee Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Platform Fees Collected:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Token Launch Fee:</span>
              <Badge variant="secondary">0.05 SOL</Badge>
            </div>
            <div className="flex justify-between">
              <span>Trading Fee:</span>
              <Badge variant="secondary">0.5%</Badge>
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Wallet Address</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(env.communityWallet)}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={openInExplorer}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="font-mono text-xs break-all bg-background/50 p-2 rounded border">
            {env.communityWallet}
          </div>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <strong>Community Treasury:</strong> All fees collected from token launches and trading
            are sent here to fund platform development, community rewards, and ecosystem growth.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityWalletInfo;
