"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { candidates, initialUsers } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Vote, VoteResult, PartyVote, User } from "@/lib/types";

const chartConfig = {
  votes: {
    label: "Votes",
    color: "hsl(var(--primary))",
  },
  DMK: { label: "DMK", color: "hsl(var(--chart-1))" },
  ADMK: { label: "ADMK", color: "hsl(var(--chart-2))" },
  TVK: { label: "TVK", color: "hsl(var(--chart-3))" },
  NTK: { label: "NTK", color: "hsl(var(--chart-4))" },
  BJP: { label: "BJP", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;


export default function ResultsPage() {
  const [ledgerVotes, setLedgerVotes] = useState<Vote[]>([]);
  const [voteResults, setVoteResults] = useState<VoteResult[]>(
    candidates.map(c => ({ name: c.name, votes: 0 }))
  );
  const [partyVotes, setPartyVotes] = useState<PartyVote[]>(
    candidates.map(c => ({ party: c.name, votes: 0 }))
  );
  const [totalVotes, setTotalVotes] = useState(0);
  const [registeredVoters, setRegisteredVoters] = useState(0);

  useEffect(() => {
    const storedVotesJSON = localStorage.getItem("verityvote_votes");
    const votes: Vote[] = storedVotesJSON ? JSON.parse(storedVotesJSON) : [];
    setLedgerVotes(votes);

    const calculatedResults = candidates.map(c => {
        const candidateVotes = votes.filter(v => v.candidateId === c.id).length;
        return { name: c.name, votes: candidateVotes };
    });
    setVoteResults(calculatedResults);
    
    const calculatedPartyVotes = candidates.map(c => {
        const candidateVotes = votes.filter(v => v.candidateId === c.id).length;
        return { party: c.name, votes: candidateVotes };
    });
    setPartyVotes(calculatedPartyVotes);

    const total = calculatedResults.reduce((sum, current) => sum + current.votes, 0);
    setTotalVotes(total);

    const storedUsersJSON = localStorage.getItem("verityvote_users");
    const users: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : initialUsers;
    setRegisteredVoters(users.length);

  }, []);

  const getCandidateNameById = (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    return candidate ? candidate.name : "Unknown Candidate";
  };

  const turnout = registeredVoters > 0 ? (totalVotes / registeredVoters) * 100 : 0;

  const renderChartContent = (chart: React.ReactNode, height: number) => {
    if (totalVotes === 0) {
      return <div className={`h-[${height}px] w-full flex items-center justify-center text-muted-foreground`}>No votes have been cast yet.</div>;
    }
    return chart;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
        <p className="text-muted-foreground">Live and transparent vote counts.</p>
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
                        <Cell key={`cell-${entry.party}`} fill={`var(--color-${entry.party})`} />
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
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Votes Cast</span>
                  <span className="font-semibold">
                    {totalVotes.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Registered Voters</span>
                  <span className="font-semibold">{registeredVoters.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Voter Turnout</span>
                  <span className="font-semibold">
                    {turnout.toFixed(2)}%
                  </span>
                </div>
                 <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Election Status</span>
                  <span className="font-semibold text-green-500">Live</span>
                </div>
              </>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Vote Ledger (Client-Side Simulation)</CardTitle>
              <CardDescription>
                A transparent log of votes recorded by this browser session.
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
                    {ledgerVotes.length > 0 ? (
                      ledgerVotes
                        .slice()
                        .reverse()
                        .map((vote) => (
                          <TableRow key={vote.id}>
                            <TableCell className="font-mono text-xs">
                              {`${vote.id.slice(0,14)}...`}
                            </TableCell>
                            <TableCell>
                              {getCandidateNameById(vote.candidateId)}
                            </TableCell>
                            <TableCell className="text-right">
                              {new Date(vote.votedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No votes have been recorded in this browser session.
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
