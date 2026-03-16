"use client"
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ArrowRight, ShieldAlert, Loader2, Wallet, CheckCircle2 } from 'lucide-react';
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
import type { Candidate, Vote } from "@/lib/types";
import { useFirebase, useCollection, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useWeb3 } from "@/app/providers";

function CandidateCard({ candidate, onVote, isVoted, disabled }: { candidate: Candidate, onVote: (c: Candidate) => void, isVoted: boolean, disabled: boolean }) {
  const isDisabled = isVoted || disabled;

  return (
    <Card 
      onClick={() => !isDisabled && onVote(candidate)}
      className="group/card relative flex h-full cursor-pointer flex-col items-center overflow-hidden transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:shadow-xl hover:-translate-y-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
      data-disabled={isDisabled ? true : undefined}
    >
      <div className="relative w-full aspect-[4/5] bg-muted overflow-hidden">
        {candidate.imageUrl && (
          <Image 
            src={candidate.imageUrl} 
            alt={candidate.name} 
            fill 
            className="object-cover transition-transform duration-500 group-hover/card:scale-110"
            data-ai-hint={candidate.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80">{candidate.party}</p>
          <h3 className="text-xl font-bold">{candidate.name}</h3>
        </div>
      </div>
      <CardContent className="p-4 w-full bg-card">
        <Button 
          variant={isVoted ? "secondary" : "default"} 
          className="w-full gap-2" 
          disabled={isDisabled}
        >
          {isVoted ? <CheckCircle2 className="h-4 w-4" /> : null}
          {isVoted ? "Vote Cast" : "Select Candidate"}
        </Button>
      </CardContent>
      <div className="absolute inset-0 bg-primary/20 pointer-events-none opacity-0 transition-opacity group-hover/card:opacity-100 data-[disabled]:hidden" />
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
  
  const { toast } = useToast();
  const router = useRouter();
  const { user, firestore, isUserLoading } = useFirebase();
  const { contract, address, connectWallet, isLoading: isWeb3Loading } = useWeb3();

  const userVotesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "votes");
  }, [firestore, user]);

  const { data: userVotes, isLoading: isLoadingVotes } = useCollection<Vote>(userVotesCollection);

  const hasAlreadyVoted = useMemo(() => {
    if (userVotes && userVotes.length > 0) return true;
    return false;
  }, [userVotes]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isCheckingVote = isUserLoading || isLoadingVotes;

  const handleInitiateVote = (candidate: Candidate) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "Please log in to your OOTU account to vote.",
        });
        router.push('/login');
        return;
    }
    if (!address) {
        toast({
            variant: "destructive",
            title: "Wallet Not Connected",
            description: "Please connect your Web3 wallet to vote on the blockchain.",
        });
        return;
    }
    setSelectedCandidate(candidate);
    setIsConfirming(true);
  };

  const handleBlockchainVote = async (candidate: Candidate) => {
    if (!contract) {
      toast({ variant: "destructive", title: "Web3 Error", description: "Smart contract not initialized." });
      return;
    }

    try {
      const numericId = parseInt(candidate.id.replace('c', ''));
      const tx = await contract.vote(numericId);
      setTxHash(tx.hash);
      
      toast({
        title: "Transaction Sent",
        description: "Your vote is being broadcast to the blockchain ledger.",
      });

      await tx.wait();
      return true;
    } catch (error: any) {
      console.error("Blockchain Vote Error:", error);
      toast({
        variant: "destructive",
        title: "Blockchain Error",
        description: error.reason || error.message || "Failed to submit vote to blockchain.",
      });
      return false;
    }
  }

  const handleFirestoreVote = async (candidate: Candidate) => {
    if (!user || !userVotesCollection) return;

    const newVote: Omit<Vote, 'id'> = {
      voterId: user.uid,
      candidateId: candidate.id,
      timestamp: serverTimestamp(),
      electionId: "main_election",
      isVerified: true,
    };

    addDocumentNonBlocking(userVotesCollection, newVote);
  }

  const handleVote = async (candidate: Candidate) => {
    setIsConfirming(false);
    setIsSubmitting(true);

    const success = await handleBlockchainVote(candidate);
    
    if (success) {
      await handleFirestoreVote(candidate);
      setVotedCandidateId(candidate.id);
      
      toast({
        title: "Vote Confirmed!",
        description: `Your vote for ${candidate.name} is now immutable on the blockchain.`,
        duration: 5000,
      });
    }

    setIsSubmitting(false);
  };

  useEffect(() => {
    if (votedCandidateId) {
      const timer = setTimeout(() => {
        router.push('/dashboard/results');
      }, 4000); 

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
          <Card className="text-center shadow-2xl border-primary/20">
            <CardHeader>
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Vote Confirmed</CardTitle>
              <CardDescription className="pt-2">
                Your choice for <strong>{votedCandidate?.name}</strong> has been etched into the blockchain.
                <br/>
                <span className="mt-4 block text-xs font-mono text-muted-foreground p-3 bg-muted rounded border overflow-hidden text-ellipsis">
                  TX: {txHash}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/results">
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
  const pageDisabled = !isMounted || isCheckingVote || isSubmitting || isWeb3Loading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voting Booth</h1>
          <p className="text-muted-foreground">
            {!isMounted ? "Initialising Secure Link..." : 
             isCheckingVote ? "Verifying Eligibility..." : 
             isVoted ? "Vote Recorded" : 
             !address ? "Connect Wallet to Access Ballot" : 
             "Cast your immutable vote on the blockchain."}
          </p>
        </div>
        {!address && isMounted && (
          <Button onClick={connectWallet} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
            <Wallet className="h-4 w-4" /> Connect Wallet to Vote
          </Button>
        )}
      </div>
      
      {isMounted && isVoted && (
        <Alert variant="default" className="bg-primary/5 border-primary/20 text-primary">
          <CheckCircle2 className="h-4 w-4 !text-primary" />
          <AlertTitle>Vote Recorded</AlertTitle>
          <AlertDescription>
            Our records show you have already participated. To maintain protocol integrity, only one vote per verified voter is permitted.
          </AlertDescription>
        </Alert>
      )}

       {isSubmitting && (
         <Alert className="border-primary/50 bg-primary/5">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <AlertTitle>Executing On-Chain Transaction</AlertTitle>
          <AlertDescription>
            Interacting with the smart contract ledger. Please confirm the signature request in your wallet.
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
            <AlertDialogTitle>Confirm Blockchain Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              You are casting a permanent vote for <strong>{selectedCandidate?.name}</strong>. 
              This action will be broadcast to the decentralized network and cannot be reversed or altered.
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
