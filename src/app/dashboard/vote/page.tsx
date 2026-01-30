"use client"
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Candidate } from "@/lib/types";

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

function CandidateCard({ candidate, onVote, isVoted }: { candidate: Candidate, onVote: (c: Candidate) => void, isVoted: boolean }) {
  const Symbol = partySymbols[candidate.name] || (() => null);
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={isVoted}>
        <Card className="group/card flex flex-col overflow-hidden transition-all h-full cursor-pointer data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 hover:shadow-lg hover:border-primary">
            <CardContent className="p-4 flex flex-col items-center justify-center flex-grow aspect-square">
              <Symbol className="h-24 w-24 text-muted-foreground group-hover/card:text-foreground transition-colors" />
            </CardContent>
            <div className="flex flex-col flex-grow">
                <CardHeader className="p-4 flex-grow text-center">
                    <CardTitle className="text-xl">{candidate.name}</CardTitle>
                    <CardDescription className="text-xs">{candidate.party}</CardDescription>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                    <Button className="w-full" variant={isVoted ? "secondary" : "default"} disabled={isVoted}>
                      {isVoted ? "Vote Cast" : "Vote"}
                    </Button>
                </CardFooter>
            </div>
        </Card>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to cast your vote for <strong>{candidate.name}</strong> from the party <strong>{candidate.party}</strong>. This action is irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onVote(candidate)}>
            Confirm Vote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function VotePage() {
  const [votedCandidate, setVotedCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();

  const handleVote = (candidate: Candidate) => {
    setVotedCandidate(candidate);
    toast({
      title: "Vote Submitted!",
      description: `Your vote for ${candidate.name} has been securely recorded on the blockchain.`,
      duration: 5000,
    });
  };
  
  if (votedCandidate) {
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
                Your vote for <strong>{votedCandidate.name}</strong> has been successfully recorded.
                <br/>
                Every vote counts towards a stronger democracy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/results">
                <Button>
                  View Live Results
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voting Booth</h1>
        <p className="text-muted-foreground">Select a candidate to cast your vote. You can only vote once.</p>
      </div>
      
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
              onVote={handleVote}
              isVoted={!!votedCandidate}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
