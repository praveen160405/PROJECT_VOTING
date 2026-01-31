"use client"
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { useWeb3 } from "@/app/providers";
import { collection } from "firebase/firestore";

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
import { votingContractAddress } from "@/lib/contract";
import { useFirebase, useCollection, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";

const partySymbols: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  DMK: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18.2152C8.74249 16.2913 15.2575 16.2913 20 18.2152" stroke="hsl(var(--foreground))" />
      <path d="M6.33398 18.2152C6.33398 15.7099 8.81592 14.1552 12 14.1552C15.1841 14.1552 17.666 15.7099 17.666 18.2152" stroke="hsl(var(--foreground))" />
      <path d="M12 14.1552V10.0776" stroke="hsl(var(--foreground))" />
      <path d="M12 5.21521L12.01 5.2041" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
      <path d="M5.33398 8.4442L5.3431 8.43509" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
      <path d="M18.667 8.4442L18.6579 8.43509" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
      <path d="M8.66602 5.21521L8.67513 5.2061" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
      <path d="M15.334 5.21521L15.3249 5.2061" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
      <path d="M12 10.0776C14.7614 10.0776 17 7.83904 17 5.07764C17 2.31623 14.7614 0.0776367 12 0.0776367C9.23858 0.0776367 7 2.31623 7 5.07764C7 7.83904 9.23858 10.0776 12 10.0776Z" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" />
    </svg>
  ),
  ADMK: (props) => (
     <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 12c-2.667 2.667-6 4-6 8" fill="none" stroke="hsl(var(--chart-2))" strokeWidth="2"/>
        <path d="M10 12c2.667 2.667 6 4 6 8" fill="none" stroke="hsl(var(--chart-2))" strokeWidth="2"/>
        <path d="M12 22V12" stroke="hsl(var(--foreground))" strokeWidth="1.5"/>
        <path d="M14 2s-2.667 4-6 4" stroke="hsl(var(--foreground))"/>
        <path d="M10 2s2.667 4 6 4" stroke="hsl(var(--foreground))"/>
    </svg>
  ),
  TVK: (props) => <Star {...props} className="text-yellow-500 fill-yellow-500" />,
  NTK: (props) => (
    <svg {...props} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 59V10C22 7.79086 23.7909 6 26 6H38C40.2091 6 42 7.79086 42 10V59" stroke="hsl(var(--foreground))" strokeWidth="4"/>
      <path d="M22 14H42" stroke="hsl(var(--foreground))" strokeWidth="4" strokeLinecap="round"/>
      <path d="M22 22H42" stroke="hsl(var(--foreground))" strokeWidth="4" strokeLinecap="round"/>
      <path d="M22 30H42" stroke="hsl(var(--foreground))" strokeWidth="4" strokeLinecap="round"/>
      <path d="M22 38H42" stroke="hsl(var(--foreground))" strokeWidth="4" strokeLinecap="round"/>
      <path d="M22 46H42" stroke="hsl(var(--foreground))" strokeWidth="4" strokeLinecap="round"/>
      <path d="M32 59V6" stroke="hsl(var(--foreground))" strokeWidth="4"/>
    </svg>
  ),
  BJP: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="hsl(var(--primary))" stroke="hsl(var(--primary))"/>
      <path d="M2 8.5C2 7 2.5 5.5 3.5 4.5" stroke="hsl(var(--foreground))" />
      <path d="M22 8.5C22 7 21.5 5.5 20.5 4.5" stroke="hsl(var(--foreground))" />
      <path d="M7.5 3C9 3 10.5 4 12 5.5" stroke="hsl(var(--foreground))" />
      <path d="M16.5 3C15 3 13.5 4 12 5.5" stroke="hsl(var(--foreground))" />
      <path d="M12 21.35V12" stroke="hsl(var(--foreground))"/>
    </svg>
  ),
};

function CandidateCard({ candidate, onVote, isVoted, disabled }: { candidate: Candidate, onVote: (c: Candidate) => void, isVoted: boolean, disabled: boolean }) {
  const Symbol = partySymbols[candidate.name] || (() => null);
  const isDisabled = isVoted || disabled;

  return (
    <Card 
      onClick={() => !isDisabled && onVote(candidate)}
      className="group/card relative flex h-full cursor-pointer flex-col items-center justify-center overflow-hidden p-6 text-center transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:shadow-xl hover:-translate-y-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
      data-disabled={isDisabled ? true : undefined}
    >
      <Symbol className="h-28 w-28 text-muted-foreground transition-colors group-hover/card:text-primary" />
      <CardTitle className="mt-4 text-2xl font-bold">{candidate.name}</CardTitle>
      <CardDescription className="mt-1 text-sm">{candidate.party}</CardDescription>
      <div className="absolute inset-0 bg-primary/90 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 data-[disabled]:hidden">
        <span className="text-xl font-semibold text-primary-foreground">Vote</span>
      </div>
    </Card>
  );
}


export default function VotePage() {
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const { user, firestore, isUserLoading } = useFirebase();

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
            description: "Please log in to vote.",
        });
        router.push('/login');
        return;
    }
    setSelectedCandidate(candidate);
    setIsConfirming(true);
  };

  const handleFirestoreVote = async (candidate: Candidate) => {
    if (!user || !userVotesCollection) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Could not identify user. Please try logging in again." });
      return;
    }
    setIsSubmitting(true);
    const newVote: Omit<Vote, 'id'> = {
      voterId: user.uid,
      candidateId: candidate.id,
      votedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(userVotesCollection, newVote);
    setVotedCandidateId(candidate.id);
    
    toast({
      title: "Vote Submitted!",
      description: `Your vote for ${candidate.name} has been recorded.`,
      duration: 5000,
    });
    setIsSubmitting(false);
  }

  const handleVote = async (candidate: Candidate) => {
    setIsConfirming(false);
    await handleFirestoreVote(candidate);
  };

  useEffect(() => {
    if (votedCandidateId) {
      const timer = setTimeout(() => {
        router.push('/dashboard/results');
      }, 3000); 

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
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl font-bold tracking-tight">Thank You for Voting!</CardTitle>
              <CardDescription>
                Your vote for <strong>{votedCandidate?.name}</strong> has been successfully recorded.
                <br/>
                You will be redirected to the results page shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/results">
                <Button>
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
  const pageDisabled = !isMounted || isCheckingVote || isSubmitting;

  const getPageDescription = () => {
    if (isCheckingVote) return "Checking your voting status...";
    if (isVoted) return "Your vote has been recorded. You cannot vote again.";
    if (!user) return "Please log in to see your voting status.";
    return "Select a candidate to cast your vote. This action is irreversible.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voting Booth</h1>
        <p className="text-muted-foreground">
          {isMounted ? getPageDescription() : "Loading..."}
        </p>
      </div>
      
      {isMounted && isVoted && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
          <ShieldAlert className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
          <AlertTitle>Vote Recorded</AlertTitle>
          <AlertDescription>
            Our records indicate that you have already cast a vote. Each account is allowed only one vote.
          </AlertDescription>
        </Alert>
      )}

       {isSubmitting && (
         <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Processing Vote</AlertTitle>
          <AlertDescription>
            Your vote is being recorded. Please wait.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {candidates.map((candidate) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to cast your vote for <strong>{selectedCandidate?.name}</strong> from the party <strong>{selectedCandidate?.party}</strong>. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedCandidate && handleVote(selectedCandidate)}>
              Confirm Vote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
