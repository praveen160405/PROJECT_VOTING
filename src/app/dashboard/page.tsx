"use client";

import Link from "next/link";
import { useFirebase, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, ArrowRight, BarChart, ShieldCheck, Zap, Globe, Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Voter } from "@/lib/types";

export default function DashboardPage() {
  const { user, firestore } = useFirebase();

  // Fetch current user profile for verification status
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<Voter>(userDocRef);

  // Fetch total voters count for system participation stat
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "users");
  }, [firestore]);
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<Voter>(usersCollectionRef);

  const stats = [
    {
      label: "Verification Status",
      value: profile?.id ? "Verified" : "Pending",
      description: "Digital identity confirmed",
      icon: ShieldCheck,
      color: "text-green-500",
      isLoading: isProfileLoading
    },
    {
      label: "Blockchain Health",
      value: "99.9%",
      description: "Network sync active",
      icon: Zap,
      color: "text-blue-500",
      isLoading: false
    },
    {
      label: "Total Participation",
      value: allUsers?.length || "0",
      description: "Registered voters",
      icon: Users,
      color: "text-primary",
      isLoading: isUsersLoading
    },
    {
      label: "Election Status",
      value: "Live",
      description: "Phase: General Election",
      icon: Globe,
      color: "text-green-500",
      isLoading: false
    }
  ];

  const features = [
    {
      title: "Cast Your Vote",
      description: "Browse verified candidates and make your voice heard on the blockchain.",
      link: "/dashboard/vote",
      icon: Vote,
      cta: "Go to Voting Booth",
    },
    {
      title: "View Results",
      description: "See the live, transparent election results directly from the smart contract.",
      link: "/dashboard/results",
      icon: BarChart,
      cta: "See Live Results",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voter Command Center</h1>
          <p className="text-muted-foreground">Secure gateway to the OOTU Decentralized Voting Protocol.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full text-sm font-medium">
          <Clock className="h-4 w-4 text-primary animate-pulse" />
          <span>Election ends in: <span className="font-bold">48:12:05</span></span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  {stat.isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <feature.icon className="h-24 w-24" />
            </div>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end pt-4">
              <Link href={feature.link} className="w-full">
                <Button className="w-full">
                  {feature.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
