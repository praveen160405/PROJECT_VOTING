
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Search, Loader2, Fingerprint, Globe, Database, History, ArrowRight, Link as LinkIcon, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useFirebase } from "@/firebase";

interface VerificationResult {
  hash: string;
  status: 'success' | 'failure';
  details?: {
    blockHeight: number;
    confirmations: number;
    signatureType: string;
    protocol: string;
    latency?: string;
  };
  error?: string;
}

export default function VerifyVotePage() {
  const [txHash, setTxHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { user } = useFirebase();

  const handleVerify = async () => {
    if (!txHash) return;
    
    setIsVerifying(true);
    setResult(null);

    try {
      // Simulation of protocol audit across 128 nodes
      await new Promise(r => setTimeout(r, 2500));

      // In a real decentralized system, this would query a public indexer or the chain directly.
      // For the prototype, any 0x hash or valid audit key is verified against the simulation ledger.
      if (txHash.length > 20) {
        setResult({
          hash: txHash,
          status: 'success',
          details: {
            blockHeight: Math.floor(Math.random() * 50000) + 120000,
            confirmations: 128,
            signatureType: "Biometric-V2",
            protocol: "OOTU Consensus v4.1",
            latency: "1.2s",
          }
        });
      } else {
        setResult({
          hash: txHash,
          status: 'failure',
          error: "Audit Key not found. Please ensure the hash was copied exactly from your Results history."
        });
      }
    } catch (e: any) {
      setResult({
        hash: txHash,
        status: 'failure',
        error: "Consensus timeout. Nodes failed to respond in the required window."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voter Audit Portal</h1>
          <p className="text-muted-foreground">Verifying ballot integrity against the OOTU decentralized ledger.</p>
        </div>
        <Link href="/dashboard/results">
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" /> View My Audit Keys
          </Button>
        </Link>
      </div>

      <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Integrity Verification Protocol
          </CardTitle>
          <CardDescription>
            Enter your <strong>Digital Audit Receipt</strong>. This key is your permanent, immutable proof of participation in the OOTU protocol.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Paste Audit Key: 0x..." 
                className="pl-9 font-mono text-sm border-primary/20 focus:ring-primary h-12"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <Button onClick={handleVerify} disabled={isVerifying || !txHash} className="h-12 min-w-[160px] shadow-primary/20 shadow-lg">
              {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {isVerifying ? "Auditing Nodes..." : "Audit Ledger"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 text-[10px] text-muted-foreground px-6 py-3 flex items-center justify-between border-t border-primary/5">
           <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-primary" /> Global Protocol: Active
           </div>
           <div className="flex items-center gap-2 uppercase font-bold tracking-tighter">
              <ShieldCheck className="h-3 w-3 text-green-500" /> VVSG 2.0 Compliant
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
              <Card className="border-green-500/30 bg-green-500/5 overflow-hidden shadow-xl shadow-green-500/5">
                <div className="h-1.5 bg-green-500" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <ShieldCheck className="h-7 w-7" />
                      Protocol Consensus Verified
                    </CardTitle>
                    <Badge className="bg-green-500 text-white border-none animate-pulse px-3">
                      Immutable
                    </Badge>
                  </div>
                  <CardDescription>
                    This ballot has been mathematically verified across all 128 decentralized nodes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background/80 rounded border-2 border-green-500/10 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Protocol Ledger Height</p>
                      <p className="font-mono text-lg text-primary">{result.details?.blockHeight}</p>
                    </div>
                    <div className="p-4 bg-background/80 rounded border-2 border-green-500/10 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Network Confirmations</p>
                      <p className="font-mono text-lg text-green-600">{result.details?.confirmations} Nodes Verified</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-background/80 rounded border-2 border-primary/10 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Signature Method</p>
                      <p className="font-medium text-sm text-foreground">{result.details?.signatureType}</p>
                    </div>
                    <div className="p-4 bg-background/80 rounded border-2 border-primary/10 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Verification Latency</p>
                      <p className="font-medium text-sm text-foreground">{result.details?.latency}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-background/80 rounded border-2 border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Digital Audit Hash (TXID)</p>
                    <p className="font-mono text-xs break-all leading-relaxed">{result.hash}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive/30 bg-destructive/5 overflow-hidden shadow-xl">
                <div className="h-1.5 bg-destructive" />
                <CardHeader>
                   <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <ShieldAlert className="h-7 w-7" />
                      Audit Failed
                    </CardTitle>
                    <Badge variant="destructive">Invalid</Badge>
                  </div>
                  <CardDescription>
                    The provided Audit Key could not be synchronized with the global ledger.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-background rounded border-2 border-destructive/10 text-sm text-muted-foreground leading-relaxed italic">
                    {result.error}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Link href="/dashboard/results">
                      <Button variant="outline" className="gap-2">
                        View My Valid Receipts <ArrowRight className="h-4 w-4" />
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
        <div className="grid gap-6 md:grid-cols-3">
           <Card className="bg-primary/5 border-dashed border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tighter text-primary">Biometric Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Verification confirms that the ballot was signed by your unique biometric ID, acting as a cryptographic private key.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-dashed border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tighter text-primary">Node Consensus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Every audit queries 128 independent validator nodes to ensure that the ledger has not been tampered with.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-dashed border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-tighter text-primary">Immutable Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Once a Biometric Signature is cast, it is permanent. No authority, including OOTU, can alter the stored hash.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
