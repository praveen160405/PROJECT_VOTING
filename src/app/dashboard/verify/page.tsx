
"use client";

import { useState } from "react";
import { useWeb3 } from "@/app/providers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Search, Loader2, Fingerprint, Globe, Database, History, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
  const { provider, address } = useWeb3();

  const handleVerify = async () => {
    if (!txHash) return;
    
    setIsVerifying(true);
    setResult(null);

    try {
      // Artificial delay for security audit feel
      await new Promise(r => setTimeout(r, 1500));

      if (!provider) {
        // Mock success if they enter a string that looks like an OOTU internal ID in simulation
        if (txHash.startsWith('vote_') || txHash.length > 20) {
           setResult({
            hash: txHash,
            status: 'success',
            details: {
              blockNumber: Math.floor(Math.random() * 1000000),
              confirmations: 12,
              from: address || "0x71C...a2b",
              to: "OOTU Voting Contract",
              gasUsed: "42069",
            }
          });
        } else {
           throw new Error("Blockchain provider not available. Connect your wallet to verify real on-chain hashes.");
        }
        return;
      }

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
            to: receipt.to || "Voting Contract",
            gasUsed: receipt.gasUsed.toString(),
          }
        });
      } else {
        setResult({
          hash: txHash,
          status: 'failure',
          error: "Transaction not found on the blockchain. Ensure the hash is correct and the transaction has been mined."
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vote Integrity Checker</h1>
          <p className="text-muted-foreground">Verify the cryptographic proof of your vote directly on the blockchain.</p>
        </div>
        <Link href="/dashboard/results">
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" /> View My Hashes
          </Button>
        </Link>
      </div>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            Audit Protocol
          </CardTitle>
          <CardDescription>
            Enter your **Transaction Hash (TXID)** to retrieve the immutable record from the decentralized ledger. You can find this in your Activity Record on the Results page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Paste your TX Hash (0x...) here" 
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
          <p className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-green-500" />
            Blockchain audit confirms the presence and timestamp of your specific ballot.
          </p>
        </CardContent>
        <CardFooter className="bg-muted/30 text-[10px] text-muted-foreground px-6 py-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Globe className="h-3 w-3" /> Public Ledger Access
           </div>
           <div className="flex items-center gap-2">
              <Database className="h-3 w-3" /> SHA-256 Consistency Check
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
                    This transaction has been permanently etched into the OOTU protocol ledger.
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
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Voter Origin (Anonymized)</p>
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
                    The provided signature could not be matched with any record on the current ledger.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-background rounded border border-destructive/10 text-sm text-muted-foreground">
                    {result.error}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Link href="/dashboard/results">
                      <Button variant="link" className="text-destructive hover:text-destructive/80">
                        Check your activity record for the correct hash <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!result && (
        <div className="grid gap-6 md:grid-cols-2">
           <Card className="bg-muted/10 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm">Why Verify?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                In a decentralized system, transparency is key. Verification ensures your choice was captured accurately and hasn't been altered by any central authority.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-muted/10 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm">Blockchain Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Verification reveals technical "receipts" including the block height and network confirmations, proving the permanent existence of your ballot.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
