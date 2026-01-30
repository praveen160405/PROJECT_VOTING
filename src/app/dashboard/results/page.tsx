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
  DMK: {
    label: "DMK",
    color: "hsl(var(--chart-1))",
  },
  ADMK: {
    label: "ADMK",
    color: "hsl(var(--chart-2))",
  },
  TVK: {
    label: "TVK",
    color: "hsl(var(--chart-3))",
  },
  NTK: {
    label: "NTK",
    color: "hsl(var(--chart-4))",
  },
  BJP: {
    label: "BJP",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;


export default function ResultsPage() {
  const [ledgerVotes, setLedgerVotes] = useState<Vote[]>([]);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [partyVotes, setPartyVotes] = useState<PartyVote[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [registeredVoters, setRegisteredVoters] = useState(0);

  useEffect(() => {
    // This effect runs on the client after hydration
    const storedVotesJSON = localStorage.getItem("verityvote_votes");
    const votes: Vote[] = storedVotesJSON ? JSON.parse(storedVotesJSON) : [];
    setLedgerVotes(votes);

    // Calculate vote results per candidate
    const candidateResults: { [key: string]: number } = {};
    candidates.forEach(c => (candidateResults[c.name] = 0));

    votes.forEach(vote => {
      const candidate = candidates.find(c => c.id === vote.candidateId);
      if (candidate) {
        candidateResults[candidate.name]++;
      }
    });

    const voteResultsData: VoteResult[] = Object.entries(candidateResults).map(
      ([name, votes]) => ({ name, votes })
    );
    setVoteResults(voteResultsData);

    // Calculate vote results per party
    const partyResults: { [key: string]: number } = {};
    candidates.forEach(c => {
      // Assuming candidate name is the party for chart key purposes
      if (!partyResults[c.name]) {
        partyResults[c.name] = 0;
      }
    });

    votes.forEach(vote => {
      const candidate = candidates.find(c => c.id === vote.candidateId);
      if (candidate) {
        partyResults[candidate.name]++;
      }
    });

    const partyVotesData: PartyVote[] = Object.entries(partyResults).map(
      ([party, votes]) => ({ party, votes })
    );
    setPartyVotes(partyVotesData);


    setTotalVotes(votes.length);

    const storedUsersJSON = localStorage.getItem("verityvote_users");
    const users: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : initialUsers;
    setRegisteredVoters(users.length);

  }, []);

  const getCandidateNameById = (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    return candidate ? candidate.name : "Unknown Candidate";
  };

  const turnout = registeredVoters > 0 ? (totalVotes / registeredVoters) * 100 : 0;

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
            {totalVotes > 0 ? (
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
            ) : (<div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">No votes have been cast yet.</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Party Vote Distribution</CardTitle>
            <CardDescription>Share of votes for each political party.</CardDescription>
          </CardHeader>
          <CardContent>
            {totalVotes > 0 ? (
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
            </ChartContainer>
            ) : (<div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">No votes have been cast yet.</div>)}
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
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Vote Ledger</CardTitle>
              <CardDescription>
                A transparent, immutable record of all votes cast. Hashes are
                simulated for demonstration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vote Hash (Simulated)</TableHead>
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
                              {`0x...${vote.id.slice(-12)}`}
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
                          No votes have been cast yet.
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
