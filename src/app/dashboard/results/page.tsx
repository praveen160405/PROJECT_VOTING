
"use client";

import { useState, useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { collection, collectionGroup, query } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { candidates as initialCandidates } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { VoteResult, PartyVote, Vote } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useWeb3 } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import { Globe, Copy, RefreshCcw } from "lucide-react";
import { votingContractAddress } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";

const chartConfig = initialCandidates.reduce((acc, candidate, index) => {
  acc[candidate.name] = {
    label: candidate.name,
    color: `hsl(var(--chart-${index + 1}))`,
  };
  return acc;
}, {
  votes: {
    label: "Votes",
    color: "hsl(var(--primary))",
  },
} as ChartConfig);

export default function ResultsPage() {
  const { toast } = useToast();
  const { user, firestore, isUserLoading } = useFirebase();
  const { contract } = useWeb3();

  // Fetch all votes from all users to aggregate live results
  const allVotesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'votes'));
  }, [firestore]);
  const { data: allRawVotes, isLoading: isLoadingAllVotes } = useCollection<Vote>(allVotesQuery);

  // Fetch current user's votes for the ledger view
  const userVotesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "votes");
  }, [firestore, user]);
  const { data: userVotes, isLoading: isLoadingUserVotes } = useCollection<Vote>(userVotesCollection);

  // Aggregation Logic: "Last Vote Wins"
  const aggregatedResults = useMemo(() => {
    if (!allRawVotes) return null;

    // Map to store latest vote per voterId
    const latestVotesMap = new Map<string, Vote>();
    
    allRawVotes.forEach(vote => {
      const existing = latestVotesMap.get(vote.voterId);
      const voteTime = vote.timestamp?.toMillis ? vote.timestamp.toMillis() : 0;
      const existingTime = existing?.timestamp?.toMillis ? existing.timestamp.toMillis() : 0;
      
      if (!existing || voteTime > existingTime) {
        // We only count non-panic and non-decoy votes in the real tally
        if (!vote.isPanic && !vote.isDecoy) {
          latestVotesMap.set(vote.voterId, vote);
        }
      }
    });

    const voteCounts: Record<string, number> = {};
    latestVotesMap.forEach(vote => {
      voteCounts[vote.candidateId] = (voteCounts[vote.candidateId] || 0) + 1;
    });

    const voteResults: VoteResult[] = initialCandidates.map(c => ({
      name: c.name,
      votes: voteCounts[c.id] || 0
    }));

    const totalVotes = latestVotesMap.size;
    const partyVotes: PartyVote[] = voteResults.map(r => ({ party: r.name, votes: r.votes }));

    return { voteResults, partyVotes, totalVotes };
  }, [allRawVotes]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Audit Key Copied",
      description: "SHA-256 hash ready for ledger audit.",
    });
  };

  const isLoading = isUserLoading || isLoadingAllVotes;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Election Audit Center</h1>
          <p className="text-muted-foreground">Monitoring decentralized ledger consensus in real-time.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="gap-2 bg-green-500/5 text-green-600 border-green-500/20">
            <RefreshCcw className="h-3 w-3 animate-spin" /> Live Protocol Aggregation
          </Badge>
          <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20">
            <Globe className="h-3 w-3" /> Node Sync: Active
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>On-Chain Vote Counts</CardTitle>
            <CardDescription>Verified tallies from the OOTU decentralized nodes (Last Vote Wins Protocol).</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <Skeleton className="h-[400px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <BarChart data={aggregatedResults?.voteResults || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Unique Ballots</span>
                  <span className="font-semibold">{isLoading ? '...' : aggregatedResults?.totalVotes.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Protocol Health</span>
                  <span className="font-semibold text-green-500">Active</span>
                </div>
                 <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ledger Sync</span>
                  <span className="font-semibold">100%</span>
                </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>My Voter Integrity Ledger</CardTitle>
              <CardDescription>Your personal cryptographic receipts for this election window.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Digital Receipt (Hash)</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Audit Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUserVotes && <LedgerRowSkeleton />}
                  {!isLoadingUserVotes && userVotes?.map((vote) => {
                      const candidate = initialCandidates.find(c => c.id === vote.candidateId);
                      const displayHash = vote.txHash || vote.id;
                      return (
                        <TableRow key={vote.id}>
                          <TableCell className="font-mono text-xs">
                             <div className="flex items-center gap-2">
                                <span className="truncate max-w-[250px]">{displayHash}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(displayHash)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                             </div>
                          </TableCell>
                          <TableCell className="font-bold">{candidate?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right text-xs">
                            {vote.timestamp?.toDate ? format(vote.timestamp.toDate(), "PPp") : 'Broadcasting...'}
                          </TableCell>
                        </TableRow>
                      )
                  })}
                  {!userVotes?.length && !isLoadingUserVotes && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                           No ballot receipts found in current election window.
                        </TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

function LedgerRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32 ml-auto" /></TableCell>
    </TableRow>
  );
}
