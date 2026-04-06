
"use client";

import { useState, useEffect } from "react";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Pie, 
  PieChart, 
  Cell, 
  Line, 
  LineChart, 
  ResponsiveContainer 
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  type ChartConfig 
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  Globe, 
  Users, 
  Zap, 
  Clock 
} from "lucide-react";
import { motion } from "framer-motion";

const regionalData = [
  { region: "North", turnout: 78 },
  { region: "South", turnout: 85 },
  { region: "East", turnout: 62 },
  { region: "West", turnout: 71 },
];

const ageData = [
  { group: "18-25", value: 25 },
  { group: "26-40", value: 35 },
  { group: "41-60", value: 30 },
  { group: "60+", value: 10 },
];

const trendData = [
  { time: "08:00", votes: 450 },
  { time: "10:00", votes: 1200 },
  { time: "12:00", votes: 2100 },
  { time: "14:00", votes: 1800 },
  { time: "16:00", votes: 3200 },
  { time: "18:00", votes: 2400 },
];

const chartConfig: ChartConfig = {
  turnout: {
    label: "Voter Turnout %",
    color: "hsl(var(--primary))",
  },
  value: {
    label: "Electorate Share",
    color: "hsl(var(--accent))",
  },
  votes: {
    label: "Votes Cast",
    color: "hsl(var(--chart-3))",
  },
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export default function InsightsPage() {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setIsLive(true);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participation Insights</h1>
          <p className="text-muted-foreground">Comprehensive analytics of decentralized voter behavior and protocol health.</p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
              <Activity className="mr-2 h-3 w-3" /> Protocol Sync Active
            </Badge>
          )}
          <Badge variant="outline" className="gap-2">
            <Globe className="h-3 w-3" /> Global Ledger
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Regional Turnout Comparison
                </CardTitle>
                <CardDescription>Live turnout percentage across geographic nodes.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">Verified</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="turnout" fill="var(--color-turnout)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-accent" />
              Age Distribution
            </CardTitle>
            <CardDescription>Demographic breakdown of the electorate.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {ageData.map((item, i) => (
                <div key={item.group} className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{item.group}:</span>
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-3" />
              Voting Activity Trends
            </CardTitle>
            <CardDescription>Hourly aggregation of cryptographic ballot submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="votes" 
                  stroke="var(--color-votes)" 
                  strokeWidth={3} 
                  dot={{ fill: "var(--color-votes)", r: 4 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                AI Security Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="bg-background/50 border-primary/20">
                  <Zap className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-xs font-bold">Unusual Pattern Detected</AlertTitle>
                  <AlertDescription className="text-[10px]">
                    14:02: 15% spike in South Region activity. AI validation confirmed decentralized origin.
                  </AlertDescription>
                </Alert>
                <Alert className="bg-background/50 border-green-500/20">
                  <Clock className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-xs font-bold">Consensus Healthy</AlertTitle>
                  <AlertDescription className="text-[10px]">
                    Ledger synchronization average: 1.2s. Zero collisions detected in current window.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-sm">Network Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-2"><Users className="h-3 w-3"/> Active Nodes</span>
                <span className="font-bold">128</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[94%]" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Integrity Score</span>
                <span className="font-bold">99.9%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-6 border rounded-lg bg-muted/30"
      >
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          This dashboard provides a transparent window into the OOTU protocol. All metrics are aggregated from anonymized blockchain ledger data, ensuring that while participation is public, individual choices remain private and secure.
        </p>
      </motion.div>
    </div>
  );
}
