"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { candidates as initialCandidates } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Vote, VoteResult, PartyVote } from "@/lib/types";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, query } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

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
  const { user, firestore, isUserLoading } = useFirebase();

  // Fetch all votes from the 'votes' collection group for overall results
  const allVotesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, "votes"));
  }, [firestore]);
  const { data: allVotes, isLoading: isLoadingAllVotes } = useCollection<Vote>(allVotesQuery);

  // Fetch votes for the current user for the ledger
  const userVotesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "votes");
  }, [firestore, user]);
  const { data: ledgerVotes, isLoading: isLoadingLedger } = useCollection<Vote>(userVotesCollection);

  const electionResults = useMemo(() => {
    if (!allVotes) {
      return { voteResults: [], partyVotes: [], totalVotes: 0 };
    }

    const voteCounts = new Map<string, number>();
    initialCandidates.forEach(c => voteCounts.set(c.id, 0));

    allVotes.forEach(vote => {
      if (voteCounts.has(vote.candidateId)) {
        voteCounts.set(vote.candidateId, voteCounts.get(vote.candidateId)! + 1);
      }
    });

    const voteResults: VoteResult[] = initialCandidates.map(c => ({
      name: c.name,
      votes: voteCounts.get(c.id) || 0
    }));

    const partyVotes: PartyVote[] = initialCandidates.map(c => ({
        party: c.name, // Using short name for party in chart
        votes: voteCounts.get(c.id) || 0
    }));
    
    const totalVotes = allVotes.length;

    return { voteResults, partyVotes, totalVotes };
  }, [allVotes]);

  const { voteResults, partyVotes, totalVotes } = electionResults;

  const getCandidateNameById = (id: string) => {
    const candidate = initialCandidates.find(c => c.id === id);
    return candidate ? candidate.name : "Unknown Candidate";
  };
  
  const isLoadingData = isLoadingAllVotes || isUserLoading;

  const renderChartContent = (chart: React.ReactNode, height: number) => {
    if (isLoadingAllVotes) {
       return <div style={{ height: `${height}px` }} className="w-full flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
    }
    if (totalVotes === 0) {
      return <div style={{ height: `${height}px` }} className="w-full flex items-center justify-center text-muted-foreground">No votes have been cast yet.</div>;
    }
    return chart;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
        <p className="text-muted-foreground">Live and transparent vote counts from the database.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Votes per Candidate</CardTitle>
            <CardDescription>Total votes received by each candidate.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderChartContent(
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
              </ChartContainer>, 400
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Party Vote Distribution</CardTitle>
            <CardDescription>Share of votes for each political party.</CardDescription>
          </CardHeader>
          <CardContent>
             {renderChartContent(
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
                </ChartContainer>, 300
             )}
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
                  {isLoadingData ? <Skeleton className="h-5 w-20" /> : <span className="font-semibold">{totalVotes.toLocaleString()}</span> }
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
                A transparent log of votes recorded by this account in Firestore.
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
                    {isLoadingLedger ? (
                      <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
                    ) : ledgerVotes && ledgerVotes.length > 0 ? (
                      ledgerVotes
                        .slice()
                        .reverse()
                        .map((vote) => (
                          <TableRow key={vote.id}>
                            <TableCell className="font-mono text-xs">
                              {vote.id.slice(0,14)}
                            </TableCell>
                            <TableCell>
                              {getCandidateNameById(vote.candidateId)}
                            </TableCell>
                            <TableCell className="text-right">
                              {new Date(vote.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 text-center text-muted-foreground"
                        >
                          You have not voted with this account yet.
                        </TableCell>
                      </TableRow>
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
