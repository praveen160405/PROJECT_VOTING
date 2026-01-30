"use client"
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

function CandidateCard({ candidate, onVote, isVoted }: { candidate: Candidate, onVote: (c: Candidate) => void, isVoted: boolean }) {
  return (
    <AlertDialog>
      <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg h-full">
        <CardContent className="p-6 flex-grow flex items-center justify-center">
          <CardTitle className="text-3xl font-bold">{candidate.name}</CardTitle>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <AlertDialogTrigger asChild>
            <Button className="w-full" variant={isVoted ? "secondary" : "default"} disabled={isVoted}>
              {isVoted ? "Vote Cast" : "Vote"}
            </Button>
          </AlertDialogTrigger>
        </CardFooter>
      </Card>
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {candidates.map((candidate) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
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
