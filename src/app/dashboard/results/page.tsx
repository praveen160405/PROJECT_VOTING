"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { voteResults, partyVotes, candidates } from "@/lib/data";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Vote } from "@/lib/types";

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


function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    setIsSubmitting(true);
    // Simulate API call for login
    setTimeout(() => {
      if (username === 'admin' && password === 'password') {
        toast({
          title: "Login Successful",
          description: "Viewing election results.",
        });
        onLoginSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid username or password.",
        });
        setIsSubmitting(false);
      }
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Enter your credentials to view the results.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="admin"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function ResultsPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [ledgerVotes, setLedgerVotes] = useState<Vote[]>([]);

  useEffect(() => {
    const storedVotesJSON = localStorage.getItem("verityvote_votes");
    if (storedVotesJSON) {
      setLedgerVotes(JSON.parse(storedVotesJSON));
    }
  }, []);

  const getCandidateNameById = (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    return candidate ? candidate.name : "Unknown Candidate";
  };


  if (!isAdminAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Election Results</h1>
        <p className="text-muted-foreground">Live and transparent vote counts powered by the blockchain.</p>
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
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
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
                    <Cell key={`cell-${entry.party}`} fill={`var(--color-${entry.party})`} />
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
              <span className="font-semibold">
                {voteResults.reduce((acc, curr) => acc + curr.votes, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registered Voters</span>
              <span className="font-semibold">25,830</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Voter Turnout</span>
              <span className="font-semibold">
                {(
                  (voteResults.reduce((acc, curr) => acc + curr.votes, 0) /
                    25830) *
                  100
                ).toFixed(2)}
                %
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
