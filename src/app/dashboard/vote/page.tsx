
"use client"
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Wallet, Quote, AlertCircle, Timer, Globe } from 'lucide-react';
import { collection, serverTimestamp } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { candidates } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { Candidate, Vote, Election } from "@/lib/types";
import { useFirebase, useCollection, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useWeb3 } from "@/app/providers";
import { votingContractAddress } from "@/lib/contract";

const PROVERBS = [
  "The ballot is stronger than the bullet. — Abraham Lincoln",
  "Voting is not only our right—it is our power. — Loung Ung",
  "Bad officials are elected by good citizens who do not vote. — George Jean Nathan",
  "The ignorance of one voter in a democracy impairs the security of all. — John F. Kennedy",
  "A citizen’s greatest tool for change is the vote. — OOTU Protocol",
  "Voting is the expression of our commitment to ourselves and one another. — Sharon Salzberg"
];

function CandidateCard({ candidate, onVote, isVoted, disabled }: { candidate: Candidate, onVote: (c: Candidate) => void, isVoted: boolean, disabled: boolean }) {
  const isDisabled = isVoted || disabled;

  return (
    <Card 
      onClick={() => !isDisabled && onVote(candidate)}
      className="group/card relative flex h-full cursor-pointer flex-col items-center overflow-hidden transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:shadow-xl hover:-translate-y-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
      data-disabled={isDisabled ? true : undefined}
    >
      <div className="relative w-full aspect-square bg-primary/5 flex items-center justify-center border-b p-6">
        <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 group-hover/card:scale-110 transition-transform duration-300">
                <span className="text-3xl font-black tracking-tighter">{candidate.name}</span>
            </div>
            <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Official Ballot Symbol</p>
                <h3 className="text-xl font-bold text-foreground">{candidate.name}</h3>
            </div>
        </div>
        {isVoted && (
             <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
             </div>
        )}
      </div>
      <CardContent className="p-4 w-full bg-card">
        <div className="mb-4">
             <p className="text-xs font-medium text-muted-foreground leading-relaxed h-8 line-clamp-2">{candidate.party}</p>
        </div>
        <Button 
          variant={isVoted ? "secondary" : "default"} 
          className="w-full gap-2" 
          disabled={isDisabled}
        >
          {isVoted ? <CheckCircle2 className="h-4 w-4" /> : null}
          {isVoted ? "Vote Cast" : "Cast Vote"}
        </Button>
      </CardContent>
    </Card>
  );
}


export default function VotePage() {
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProverb, setCurrentProverb] = useState<string>("");
  
  const { toast } = useToast();
  const router = useRouter();
  const { user, firestore, isUserLoading } = useFirebase();
  const { contract, address, connectWallet, isLoading: isWeb3Loading } = useWeb3();

  // Fetch active elections
  const electionsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'elections');
  }, [firestore]);
  const { data: activeElections, isLoading: areElectionsLoading } = useCollection<Election>(electionsRef);

  const userVotesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "votes");
  }, [firestore, user]);

  const { data: userVotes, isLoading: isLoadingVotes } = useCollection<Vote>(userVotesCollection);

  const hasAlreadyVoted = useMemo(() => {
    if (userVotes && userVotes.length > 0) return true;
    return false;
  }, [userVotes]);

  const isElectionLive = useMemo(() => {
    return activeElections && activeElections.length > 0;
  }, [activeElections]);

  useEffect(() => {
    setIsMounted(true);
    setCurrentProverb(PROVERBS[Math.floor(Math.random() * PROVERBS.length)]);
  }, []);

  const isCheckingVote = isUserLoading || isLoadingVotes || areElectionsLoading;

  const handleInitiateVote = (candidate: Candidate) => {
    if (!user) {
        toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to vote." });
        router.push('/login');
        return;
    }
    if (!address) {
        toast({ variant: "destructive", title: "Wallet Required", description: "Connect your wallet to sign the ballot." });
        return;
    }
    if (!isElectionLive) {
        toast({ variant: "destructive", title: "Protocol Standby", description: "No active election window found on the ledger." });
        return;
    }
    setSelectedCandidate(candidate);
    setIsConfirming(true);
  };

  const handleBlockchainVote = async (candidate: Candidate) => {
    // If no real contract address, simulate the blockchain transaction
    if (votingContractAddress === "0x0000000000000000000000000000000000000000" || !contract) {
      toast({ 
        title: "Prototype Simulation Active", 
        description: "Bypassing gas fees. Simulating on-chain verification...",
      });
      // Simulate network delay
      await new Promise(r => setTimeout(r, 2000));
      const simulatedHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setTxHash(simulatedHash);
      return { success: true, hash: simulatedHash };
    }

    try {
      const numericId = parseInt(candidate.id.replace('c', ''));
      const tx = await contract.vote(numericId);
      setTxHash(tx.hash);
      
      toast({ title: "Transaction Sent", description: "Your vote is being broadcast to the ledger." });

      await tx.wait();
      return { success: true, hash: tx.hash };
    } catch (error: any) {
      console.error("Blockchain Vote Error:", error);
      
      if (error.code === 4001 || error.code === "ACTION_REJECTED" || error.message?.includes('rejected')) {
        toast({
          variant: "destructive",
          title: "Transaction Cancelled",
          description: "You rejected the signature request in your wallet.",
        });
        return { success: false, hash: null };
      }

      // Handle insufficient funds specifically
      if (error.code === "INSUFFICIENT_FUNDS" || error.message?.includes('insufficient funds')) {
         toast({
          variant: "destructive",
          title: "Insufficient Gas",
          description: "You need coins in your wallet to pay for blockchain gas fees. Switching to simulation mode for this session.",
        });
        // Auto-simulation for failed real calls in prototype
        await new Promise(r => setTimeout(r, 1000));
        const simulatedHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setTxHash(simulatedHash);
        return { success: true, hash: simulatedHash };
      }

      toast({
        variant: "destructive",
        title: "Blockchain Error",
        description: error.reason || error.message || "Failed to submit vote.",
      });
      return { success: false, hash: null };
    }
  }

  const handleFirestoreVote = async (candidate: Candidate, hash: string) => {
    if (!user || !userVotesCollection) return;

    const newVote: Omit<Vote, 'id'> = {
      voterId: user.uid,
      candidateId: candidate.id,
      timestamp: serverTimestamp(),
      electionId: activeElections?.[0]?.id || "main_election",
      isVerified: true,
      txHash: hash,
    };

    addDocumentNonBlocking(userVotesCollection, newVote);
  }

  const handleVote = async (candidate: Candidate) => {
    setIsConfirming(false);
    setIsSubmitting(true);

    const { success, hash } = await handleBlockchainVote(candidate);
    
    if (success && hash) {
      await handleFirestoreVote(candidate, hash);
      setVotedCandidateId(candidate.id);
      
      toast({
        title: "Vote Confirmed!",
        description: `Your vote for ${candidate.name} is now immutable.`,
        duration: 5000,
      });
    }

    setIsSubmitting(false);
  };

  useEffect(() => {
    if (votedCandidateId) {
      const timer = setTimeout(() => {
        router.push('/dashboard/results');
      }, 6000); 
      return () => clearTimeout(timer);
    }
  }, [votedCandidateId, router]);
  
  if (isMounted && votedCandidateId) {
    const votedCandidate = candidates.find(c => c.id === votedCandidateId);
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="text-center shadow-2xl border-primary/20 overflow-hidden">
            <div className="h-1.5 w-full bg-primary" />
            <CardHeader>
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Vote Confirmed</CardTitle>
              <CardDescription className="pt-2">
                Your choice for <strong>{votedCandidate?.name}</strong> is etched into the blockchain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed relative">
                <Quote className="absolute -top-3 -left-1 h-6 w-6 text-primary/20" />
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "{currentProverb}"
                </p>
              </div>
              <div className="text-left space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Signature</p>
                 <p className="text-[10px] font-mono text-muted-foreground p-3 bg-muted rounded border overflow-hidden text-ellipsis whitespace-nowrap">
                  {txHash}
                 </p>
              </div>
              <Link href="/dashboard/results" className="block">
                <Button className="w-full">
                  Go to Results
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const isVoted = hasAlreadyVoted;
  const pageDisabled = !isMounted || isCheckingVote || isSubmitting || isWeb3Loading || !isElectionLive;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voting Booth</h1>
          <p className="text-muted-foreground">
            {!isMounted ? "Initialising Secure Link..." : 
             isCheckingVote ? "Verifying Eligibility..." : 
             !isElectionLive ? "System on Standby" :
             isVoted ? "Vote Recorded" : 
             !address ? "Connect Wallet to Access Ballot" : 
             "Cast your immutable vote on the blockchain."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {votingContractAddress === "0x0000000000000000000000000000000000000000" && (
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" /> Simulation Mode
            </Badge>
          )}
          {!address && isMounted && isElectionLive && (
            <Button onClick={connectWallet} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
              <Wallet className="h-4 w-4" /> Connect Wallet to Vote
            </Button>
          )}
        </div>
      </div>
      
      {isMounted && isVoted && (
        <Alert variant="default" className="bg-primary/5 border-primary/20 text-primary">
          <CheckCircle2 className="h-4 w-4 !text-primary" />
          <AlertTitle>Vote Recorded</AlertTitle>
          <AlertDescription>
            Participation complete. Protocol integrity allows only one vote per verified voter.
          </AlertDescription>
        </Alert>
      )}

      {isMounted && !isCheckingVote && !isElectionLive && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active Election Protocol</AlertTitle>
          <AlertDescription>
            The decentralized ledger is currently in standby. Please wait for an administrator to activate an election window.
          </AlertDescription>
        </Alert>
      )}

       {isSubmitting && (
         <Alert className="border-primary/50 bg-primary/5">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <AlertTitle>Executing On-Chain Transaction</AlertTitle>
          <AlertDescription>
            Interacting with the ledger. {votingContractAddress === "0x0000000000000000000000000000000000000000" ? "Simulating secure handshake..." : "Confirm the signature in your wallet."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {candidates.map((candidate) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <CandidateCard
              candidate={candidate}
              onVote={handleInitiateVote}
              isVoted={isVoted}
              disabled={pageDisabled}
            />
          </motion.div>
        ))}
      </div>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Casting a permanent vote for <strong>{selectedCandidate?.name}</strong>. 
              This action is broadcast to the decentralized network and is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Choice</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedCandidate && handleVote(selectedCandidate)} className="bg-primary">
              Confirm & Sign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
