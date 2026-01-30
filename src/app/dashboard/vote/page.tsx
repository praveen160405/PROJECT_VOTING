"use client"
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sunrise, Leaf, Star, Tractor } from 'lucide-react';

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

const PartySymbol = ({ partyName }: { partyName: string }) => {
  const symbolProps = { className: "h-16 w-16 text-muted-foreground group-hover/card:text-primary transition-colors" };
  switch (partyName) {
    case 'DMK':
      return <Sunrise {...symbolProps} />;
    case 'ADMK':
      return (
        <div className="flex items-center justify-center h-16 w-16">
            <div className="flex -space-x-7">
                <Leaf {...symbolProps} className="h-12 w-12" style={{transform: 'rotate(-25deg)'}} />
                <Leaf {...symbolProps} className="h-12 w-12" style={{transform: 'rotate(25deg) scaleX(-1)'}}/>
            </div>
        </div>
      );
    case 'TVK':
      return <Star {...symbolProps} />;
    case 'NTK':
      return <Tractor {...symbolProps} />;
    case 'BJP':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...symbolProps}
        >
          <path d="M8.8 20.9a2.5 2.5 0 1 0 6.4 0" />
          <path d="M12 18a4.9 4.9 0 0 0 4.9-4.9c0-2.1-1.7-4.4-4.9-7.1-3.2 2.7-4.9 5-4.9 7.1A4.9 4.9 0 0 0 12 18Z" />
          <path d="M22 13.1c-1-3.4-4.2-6.1-10-6.1-5.8 0-9 2.7-10 6.1" />
          <path d="M16.4 13.2c.4-.8.6-1.7.6-2.6 0-3.1-3.1-5.6-7-5.6s-7 2.5-7 5.6c0 .9.2 1.8.6 2.6" />
          <path d="M5.6 12.6c-.4.8-.6 1.7-.6 2.6 0 .5.1 1 .2 1.5" />
          <path d="M18.4 12.6c.4.8.6 1.7.6 2.6 0 .5-.1 1-.2 1.5" />
        </svg>
      );
    default:
      return null;
  }
};

function CandidateCard({ candidate, onVote, isVoted }: { candidate: Candidate, onVote: (c: Candidate) => void, isVoted: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={isVoted}>
        <Card className="group/card flex flex-col overflow-hidden transition-all h-full cursor-pointer data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 hover:shadow-lg hover:border-primary">
          <div className="flex flex-col flex-grow items-center justify-between">
            <CardContent className="p-6 flex-grow flex flex-col items-center justify-center gap-4">
              <PartySymbol partyName={candidate.name} />
              <CardTitle className="text-2xl font-bold tracking-widest">{candidate.name}</CardTitle>
            </CardContent>
            <CardFooter className="w-full p-4 pt-0">
                <Button className="w-full pointer-events-none" variant={isVoted ? "secondary" : "default"}>
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
            You are about to cast your vote for <strong>{candidate.name}</strong>. This action is irreversible.
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voting Booth</h1>
        <p className="text-muted-foreground">Select a candidate to cast your vote. You can only vote once.</p>
      </div>

      <AnimatePresence>
        {votedCandidate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-accent/50 border-accent">
              <CardHeader>
                <CardTitle>Thank you for voting!</CardTitle>
                <CardDescription>
                  You have successfully cast your vote for <strong>{votedCandidate.name}</strong>. Your participation is vital for democracy.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
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
