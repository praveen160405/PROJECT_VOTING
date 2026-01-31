"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { collection } from "firebase/firestore";
import { format, isValid } from "date-fns";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { candidates as initialCandidates } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VoteResult, PartyVote, Vote } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";

// Create mock chart config
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

interface ElectionResults {
  voteResults: VoteResult[];
  partyVotes: PartyVote[];
  totalVotes: number;
}

export default function ResultsPage() {
  const [electionResults, setElectionResults] = useState<ElectionResults | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { user, firestore, isUserLoading } = useFirebase();

  const userVotesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'votes');
  }, [firestore, user]);

  const { data: userVotes, isLoading: isLoadingVotes } = useCollection<Vote>(userVotesCollection);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);


  useEffect(() => {
    if (!isMounted) return;

    // This effect is for the mock chart data
    const generateMockData = () => {
      const voteResults: VoteResult[] = initialCandidates.map(c => ({
        name: c.name,
        // Generate random votes for demonstration
        votes: Math.floor(Math.random() * 5000) + 1000
      }));

      const partyVotes: PartyVote[] = voteResults.map(vr => ({
          party: vr.name, 
          votes: vr.votes
      }));
      
      const totalVotes = voteResults.reduce((sum, result) => sum + result.votes, 0);

      setElectionResults({ voteResults, partyVotes, totalVotes });
    };
    
    generateMockData();
  }, [isMounted]);

  if (!isMounted || !electionResults) {
    return <ResultsSkeleton />;
  }

  const { voteResults, partyVotes, totalVotes } = electionResults;
  const isLoadingLedger = isUserLoading || isLoadingVotes;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
        <p className="text-muted-foreground">Demonstration of election results using mock data.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Votes per Candidate</CardTitle>
            <CardDescription>Total votes received by each candidate.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart accessibilityLayer data={voteResults}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="votes" fill="var(--color-votes)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Party Vote Distribution</CardTitle>
            <CardDescription>Share of votes for each political party.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
               <PieChart accessibilityLayer>
                 <ChartTooltip
                   cursor={{ fill: 'hsl(var(--muted))' }}
                   content={<ChartTooltipContent nameKey="party" />}
                 />
                 <Pie
                   data={partyVotes}
                   cx="50%"
                   cy="50%"
                   labelLine={false}
                   label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                   outerRadius={100}
                   dataKey="votes"
                   nameKey="party"
                 >
                   {partyVotes.map((entry) => (
                     <Cell key={`cell-${entry.party}`} fill={chartConfig[entry.party]?.color} />
                   ))}
                 </Pie>
               </PieChart>
             </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Election Statistics</CardTitle>
             <CardDescription>Key metrics of the current election.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Votes Cast</span>
                  <span className="font-semibold">{totalVotes.toLocaleString()}</span>
                </div>
                 <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Election Status</span>
                  <span className="font-semibold text-green-500">Live</span>
                </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Your Vote Ledger</CardTitle>
              <CardDescription>
                A transparent log of votes recorded by this account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vote ID</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLedger && (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24">
                                <div className="flex justify-center items-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                    {!isLoadingLedger && userVotes && userVotes.length > 0 ? (
                      userVotes.map((vote) => {
                        const candidate = initialCandidates.find(c => c.id === vote.candidateId);
                        const voteTimestamp = vote.timestamp as any;
                        const date = voteTimestamp?.toDate ? voteTimestamp.toDate() : new Date(voteTimestamp);
                        return (
                          <TableRow key={vote.id}>
                            <TableCell className="font-mono text-xs truncate max-w-[100px]">{vote.id}</TableCell>
                            <TableCell>{candidate ? candidate.name : 'Unknown'}</TableCell>
                            <TableCell className="text-right">
                              {isValid(date) ? format(date, "PPp") : "Processing..."}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      !isLoadingLedger && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="h-24 text-center text-muted-foreground"
                          >
                            {isUserLoading ? 'Authenticating...' : !user ? 'Log in to see your vote history.' : 'You have not cast any votes yet.'}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="mt-2 h-5 w-1/3" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
