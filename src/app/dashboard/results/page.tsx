"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { voteResults, partyVotes } from "@/lib/data";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

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
                <Tooltip
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
                <Tooltip
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
      </div>
    </div>
  );
}
