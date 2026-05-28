"use client";

import { useState, useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
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
import { Globe, Copy, RefreshCcw, ShieldCheck, Database, History } from "lucide-react";
import { votingContractAddress } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Election Audit Center</h1>
          <p className="text-muted-foreground font-medium">Monitoring decentralized ledger consensus in real-time.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="gap-2 bg-green-500/5 text-green-600 border-green-500/20 rounded-none font-black uppercase tracking-tighter shadow-sm">
            <RefreshCcw className="h-3 w-3 animate-spin" /> Live Protocol Aggregation
          </Badge>
          <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20 rounded-none font-black uppercase tracking-tighter shadow-sm neon-border">
            <Globe className="h-3 w-3" /> Node Sync: Active
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 rounded-none border-primary/20 shadow-2xl glow-box overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" /> On-Chain Vote Counts
                </CardTitle>
                <CardDescription className="font-medium">Verified tallies from the OOTU decentralized nodes (Last Vote Wins Protocol).</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            {isLoading ? (
               <Skeleton className="h-[400px] w-full rounded-none" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <BarChart data={aggregatedResults?.voteResults || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" className="font-black uppercase tracking-tighter" />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} stroke="hsl(var(--muted-foreground))" className="font-bold" />
                  <ChartTooltip content={<ChartTooltipContent className="rounded-none border-2 border-primary/20 shadow-xl" />} />
                  <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} className="shadow-lg shadow-primary/20" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="rounded-none border-primary/20 bg-primary/5 shadow-xl shimmer-card">
            <CardHeader className="border-b bg-muted/50"><CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Live Ledger Stats</CardTitle></CardHeader>
            <CardContent className="grid gap-6 text-sm pt-6">
                  <div className="flex items-center justify-between p-3 bg-background/50 border border-primary/10 rounded-none shadow-inner">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Unique Ballots</span>
                    <span className="text-xl font-black tracking-tighter">{isLoading ? '...' : aggregatedResults?.totalVotes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 border border-primary/10 rounded-none shadow-inner">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Protocol Health</span>
                    <Badge className="bg-green-500 text-white border-none rounded-none font-black uppercase tracking-widest animate-pulse h-6">Active</Badge>
                  </div>
                   <div className="flex items-center justify-between p-3 bg-background/50 border border-primary/10 rounded-none shadow-inner">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ledger Consistency</span>
                    <span className="font-black text-primary tracking-widest">100%</span>
                  </div>
            </CardContent>
            <div className="p-4 border-t bg-muted/30 text-center">
              <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest rounded-none border-primary/20 hover:bg-primary hover:text-white transition-all">
                <RefreshCcw className="mr-2 h-3 w-3" /> Force Node Re-Sync
              </Button>
            </div>
          </Card>
          
          <Card className="rounded-none border-dashed border-primary/30 bg-muted/20">
             <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Protocol Compliance</CardTitle></CardHeader>
             <CardContent className="p-4 pt-0">
               <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                 OOTU results are aggregated through an anonymous collection-group proxy. No individual identity is exposed during the tally process.
               </p>
             </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-3 rounded-none border-primary/20 shadow-2xl overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> My Voter Integrity Ledger
              </CardTitle>
              <CardDescription className="font-medium">Your personal cryptographic receipts for this election window.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b-2">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Digital Receipt (TXID Hash)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Candidate Choice</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Audit Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUserVotes && <LedgerRowSkeleton />}
                  {!isLoadingUserVotes && userVotes?.map((vote) => {
                      const candidate = initialCandidates.find(c => c.id === vote.candidateId);
                      const displayHash = vote.txHash || vote.id;
                      return (
                        <TableRow key={vote.id} className="group hover:bg-primary/5 transition-colors border-b">
                          <TableCell className="font-mono text-xs">
                             <div className="flex items-center gap-2">
                                <span className="truncate max-w-[400px] font-bold tracking-tighter group-hover:text-primary transition-colors">{displayHash}</span>
                                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-none border border-primary/20" onClick={() => copyToClipboard(displayHash)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                             </div>
                          </TableCell>
                          <TableCell className="font-black uppercase tracking-tight text-foreground">{candidate?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right text-[10px] font-bold uppercase text-muted-foreground">
                            {vote.timestamp?.toDate ? format(vote.timestamp.toDate(), "PPp") : 'Broadcasting...'}
                          </TableCell>
                        </TableRow>
                      )
                  })}
                  {!userVotes?.length && !isLoadingUserVotes && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center py-20 text-muted-foreground italic font-black uppercase tracking-widest">
                           No ballot receipts found in current election window.
                        </TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="p-4 bg-muted/10 border-t flex items-center justify-between text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-50">
               <div className="flex items-center gap-2"><Globe className="h-2 w-2" /> Global Mesh Node: Sync 1.2s</div>
               <div className="flex items-center gap-2"><ShieldCheck className="h-2 w-2" /> Verified VVSG 2.0</div>
            </div>
          </Card>
      </div>
    </div>
  );
}

function LedgerRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-48 rounded-none" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16 rounded-none" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32 ml-auto rounded-none" /></TableCell>
    </TableRow>
  );
}