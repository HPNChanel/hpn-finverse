import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransferSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferDetails: {
    amount: string;
    fromAddress: string;
    toAddress: string;
    txHash: string;
    gasUsed?: string;
    gasPrice?: string;
    timestamp: string;
  };
}

export function TransferSuccessModal({ 
  isOpen, 
  onClose, 
  transferDetails 
}: TransferSuccessModalProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEtherscanUrl = (txHash: string) => {
    // For local development, use a placeholder
    // In production, this would use the appropriate network
    return `https://etherscan.io/tx/${txHash}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Transfer Successful!</DialogTitle>
              <DialogDescription>
                Your ETH has been sent successfully
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transfer Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg">{transferDetails.amount} ETH</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {formatAddress(transferDetails.fromAddress)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {formatAddress(transferDetails.toAddress)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Confirmed
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(transferDetails.timestamp)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Transaction Details</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Transaction Hash</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">
                        {transferDetails.txHash.slice(0, 10)}...{transferDetails.txHash.slice(-8)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(transferDetails.txHash, 'Transaction hash')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {transferDetails.gasUsed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Gas Used</span>
                      <span>{transferDetails.gasUsed}</span>
                    </div>
                  )}

                  {transferDetails.gasPrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Gas Price</span>
                      <span>{parseFloat(transferDetails.gasPrice).toFixed(6)} ETH</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(getEtherscanUrl(transferDetails.txHash), '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Etherscan
            </Button>
            <Button onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 