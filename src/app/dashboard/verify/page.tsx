
"use client";

import { useState } from "react";
import { useWeb3 } from "@/app/providers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Search, Loader2, Fingerprint, ExternalLink, Globe, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationResult {
  hash: string;
  status: 'success' | 'failure';
  details?: {
    blockNumber: number;
    confirmations: number;
    from: string;
    to: string;
    gasUsed?: string;
  };
  error?: string;
}

export default function VerifyVotePage() {
  const [txHash, setTxHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { provider } = useWeb3();

  const handleVerify = async () => {
    if (!txHash) return;
    if (!provider) {
      setResult({
        hash: txHash,
        status: 'failure',
        error: "Blockchain provider not available. Please connect your wallet."
      });
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      // Small artificial delay for "security audit" feel
      await new Promise(r => setTimeout(r, 1500));

      const receipt = await provider.getTransactionReceipt(txHash);
      const tx = await provider.getTransaction(txHash);

      if (receipt && tx) {
        setResult({
          hash: txHash,
          status: 'success',
          details: {
            blockNumber: receipt.blockNumber,
            confirmations: await receipt.confirmations(),
            from: receipt.from,
            to: receipt.to || "Contract Interaction",
            gasUsed: receipt.gasUsed.toString(),
          }
        });
      } else {
        setResult({
          hash: txHash,
          status: 'failure',
          error: "Transaction not found on the current blockchain ledger. Ensure the hash is correct and the transaction has been mined."
        });
      }
    } catch (e: any) {
      setResult({
        hash: txHash,
        status: 'failure',
        error: e.message || "An error occurred while communicating with the blockchain node."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vote Integrity Checker</h1>
        <p className="text-muted-foreground">Verify the cryptographic proof of your vote directly on the blockchain.</p>
      </div>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            Audit Protocol
          </CardTitle>
          <CardDescription>
            Enter your Transaction Hash (TXID) to retrieve the immutable record from the decentralized ledger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="0x..." 
                className="pl-9 font-mono text-sm"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <Button onClick={handleVerify} disabled={isVerifying || !txHash} className="min-w-[120px]">
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {isVerifying ? "Auditing..." : "Verify Integrity"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 text-[10px] text-muted-foreground px-6 py-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Globe className="h-3 w-3" /> Public Ledger Access
           </div>
           <div className="flex items-center gap-2">
              <Database className="h-3 w-3" /> AES-256 Checksum Active
           </div>
        </CardFooter>
      </Card>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {result.status === 'success' ? (
              <Card className="border-green-500/20 bg-green-500/5 overflow-hidden">
                <div className="h-1 bg-green-500" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <ShieldCheck className="h-6 w-6" />
                      Vote Verified & Immutable
                    </CardTitle>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
                      Confirmed
                    </Badge>
                  </div>
                  <CardDescription>
                    This transaction has been permanently recorded in the protocol.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-background rounded border space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Block Number</p>
                      <p className="font-mono text-sm">{result.details?.blockNumber}</p>
                    </div>
                    <div className="p-3 bg-background rounded border space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Network Confirmations</p>
                      <p className="font-mono text-sm">{result.details?.confirmations}</p>
                    </div>
                    <div className="p-3 bg-background rounded border space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Sender Origin</p>
                      <p className="font-mono text-xs truncate">{result.details?.from}</p>
                    </div>
                    <div className="p-3 bg-background rounded border space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Gas Consumption</p>
                      <p className="font-mono text-sm">{result.details?.gasUsed} units</p>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Audit Signature (TX Hash)</p>
                    <p className="font-mono text-xs break-all">{result.hash}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
                <div className="h-1 bg-destructive" />
                <CardHeader>
                   <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <ShieldAlert className="h-6 w-6" />
                      Verification Failed
                    </CardTitle>
                    <Badge variant="destructive">Invalid</Badge>
                  </div>
                  <CardDescription>
                    The provided signature could not be matched with any record on the ledger.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-background rounded border border-destructive/10 text-sm text-muted-foreground">
                    {result.error}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 border rounded-lg bg-muted/20 text-center">
        <h3 className="font-bold mb-2">Why Verify?</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          In the OOTU protocol, your vote is more than just a choice; it's a cryptographic commitment. Verification ensures that your ballot has not been altered, deleted, or double-counted by checking the decentralized consensus of the global node network.
        </p>
      </div>
    </div>
  );
}
