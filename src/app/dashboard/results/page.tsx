
"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { format } from "date-fns";
import { collection, Timestamp } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { candidates as initialCandidates } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { VoteResult, PartyVote, Vote } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useWeb3 } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import { votingContractAddress } from "@/lib/contract";

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
  isLiveBlockchain?: boolean;
}

export default function ResultsPage() {
  const [electionResults, setElectionResults] = useState<ElectionResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user, firestore, isUserLoading } = useFirebase();
  const { contract, address } = useWeb3();

  const userVotesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "votes");
  }, [firestore, user]);

  const { data: userVotes, isLoading: isLoadingVotes } = useCollection<Vote>(userVotesCollection);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const isZeroAddress = votingContractAddress === "0x0000000000000000000000000000000000000000";
      
      try {
        if (contract && !isZeroAddress) {
          // Fetch real data from the blockchain
          const results: VoteResult[] = await Promise.all(
            initialCandidates.map(async (c) => {
              const numericId = parseInt(c.id.replace('c', ''));
              try {
                const votes = await contract.getVotes(numericId);
                return { name: c.name, votes: Number(votes) };
              } catch (e) {
                console.error(`Failed to fetch votes for candidate ${numericId}:`, e);
                return { name: c.name, votes: 0 };
              }
            })
          );

          const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
          const partyVotes: PartyVote[] = results.map(r => ({ party: r.name, votes: r.votes }));

          setElectionResults({ voteResults: results, partyVotes, totalVotes, isLiveBlockchain: true });
        } else {
          // Fallback to mock data if no wallet connected, contract not available, or zero address
          const voteResults: VoteResult[] = initialCandidates.map(c => ({
            name: c.name,
            votes: Math.floor(Math.random() * 5000) + 1000
          }));
          const partyVotes: PartyVote[] = voteResults.map(vr => ({ party: vr.name, votes: vr.votes }));
          const totalVotes = voteResults.reduce((sum, r) => sum + r.votes, 0);
          setElectionResults({ voteResults, partyVotes, totalVotes, isLiveBlockchain: false });
        }
      } catch (err) {
        console.error("Error fetching blockchain results:", err);
        // Ensure we still show something in case of unexpected error
        const mockResults: VoteResult[] = initialCandidates.map(c => ({
          name: c.name,
          votes: 0
        }));
        setElectionResults({ 
          voteResults: mockResults, 
          partyVotes: mockResults.map(r => ({ party: r.name, votes: r.votes })), 
          totalVotes: 0, 
          isLiveBlockchain: false 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [contract]);

  if (isLoading) {
    return <ResultsSkeleton />;
  }
  
  if (!electionResults) {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
            <p className="text-muted-foreground">Initialising election audit tools...</p>
        </div>
    );
  }

  const { voteResults, partyVotes, totalVotes, isLiveBlockchain } = electionResults;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
          <p className="text-muted-foreground">Auditing the decentralized voting ledger in real-time.</p>
        </div>
        {isLiveBlockchain ? (
          <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
            <Globe className="h-3 w-3" /> Live Blockchain Data
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            Simulation Mode
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>On-Chain Vote Counts</CardTitle>
            <CardDescription>Verified tallies retrieved from the smart contract.</CardDescription>
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
            <CardTitle>Party Distribution</CardTitle>
            <CardDescription>Visual breakdown of democratic representation.</CardDescription>
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
            <CardTitle>Ledger Statistics</CardTitle>
             <CardDescription>Real-time metrics from the OOTU protocol.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verified Votes Cast</span>
                  <span className="font-semibold">{totalVotes.toLocaleString()}</span>
                </div>
                 <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Protocol Status</span>
                  <span className="font-semibold text-green-500">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="text-xs font-mono">{isLiveBlockchain ? "Smart Contract" : "Mock Engine"}</span>
                </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Your Activity Record</CardTitle>
              <CardDescription>
                A local record of the choices you have submitted to the protocol.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vote Reference</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="text-right">Audit Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isUserLoading || isLoadingVotes) && (
                    <>
                      <LedgerRowSkeleton />
                      <LedgerRowSkeleton />
                    </>
                  )}
                  {!isUserLoading && !isLoadingVotes && userVotes && userVotes.length > 0 && (
                    userVotes.map((vote) => {
                      const candidate = initialCandidates.find(
                        (c) => c.id === vote.candidateId
                      );

                      let formattedTimestamp = 'Confirming...';
                      if (vote.timestamp && vote.timestamp instanceof Timestamp) {
                        formattedTimestamp = format(vote.timestamp.toDate(), "PPp");
                      }
                      
                      return (
                        <TableRow key={vote.id}>
                          <TableCell className="font-mono text-xs truncate max-w-[100px]">{vote.id}</TableCell>
                          <TableCell>{candidate ? candidate.name : 'Unknown Candidate'}</TableCell>
                          <TableCell className="text-right">{formattedTimestamp}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                   {!isUserLoading && !isLoadingVotes && (!userVotes || userVotes.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No personal voting history found on this device.
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
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32 ml-auto" />
      </TableCell>
    </TableRow>
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
         <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="mt-2 h-4 w-2/5" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
