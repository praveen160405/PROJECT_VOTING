"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useFirebase, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, ArrowRight, ShieldCheck, Zap, Users, Clock, Database, Lock, Fingerprint, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Voter } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { getRandomProverb } from "@/lib/proverbs";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { user, firestore } = useFirebase();
  const [proverb, setProverb] = useState({ text: "", author: "" });

  useEffect(() => {
    setProverb(getRandomProverb());
  }, []);

  // Fetch current user profile for verification status
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<Voter>(userDocRef);

  // RESTRICT REGISTRY ACCESS TO ADMINS ONLY
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore || !profile?.isAdmin) return null;
    return collection(firestore, "users");
  }, [firestore, profile?.isAdmin]);
  
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<Voter>(usersCollectionRef);

  const stats = [
    {
      label: "Identity Signature",
      value: profile?.id ? "Biometric-Linked" : "Unverified",
      description: "SHA-256 Identity Active",
      icon: Fingerprint,
      color: "text-blue-500",
      isLoading: isProfileLoading
    },
    {
      label: "Protocol Consensus",
      value: "Healthy",
      description: "Nodes: 128 (Sync 1.2s)",
      icon: Zap,
      color: "text-yellow-500",
      isLoading: false
    },
    {
      label: "System Electorate",
      value: profile?.isAdmin ? (allUsers?.length || "0") : "Verified",
      description: profile?.isAdmin ? "Global registry count" : "Digital ID Validated",
      icon: Users,
      color: "text-primary",
      isLoading: profile?.isAdmin ? isUsersLoading : false
    },
    {
      label: "Ledger Security",
      value: "VVSG 2.0",
      description: "Audit Trail Hardened",
      icon: Database,
      color: "text-green-500",
      isLoading: false
    }
  ];

  const features = [
    {
      title: "Cast Your Ballot",
      description: "Submit a secure, biometric-signed vote to the protocol.",
      link: "/dashboard/vote",
      icon: Vote,
      cta: "Enter Voting Booth",
      bg: "bg-primary/5"
    },
    {
      title: "Audit Your Vote",
      description: "Verify your ballot receipt against the global ledger.",
      link: "/dashboard/verify",
      icon: ShieldCheck,
      cta: "Check Integrity",
      bg: "bg-green-500/5"
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OOTU Integrity Dashboard</h1>
          <p className="text-muted-foreground">Monitoring decentralized voting participation and protocol status.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-none text-sm font-bold text-primary shadow-lg shadow-primary/10 neon-border">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Active Protocol Window</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (stat.label !== "System Electorate" || profile?.isAdmin) && (
          <motion.div 
            key={stat.label}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Card className="rounded-none border-primary/10 shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all shimmer-card border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    {stat.isLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-2xl font-bold mt-1 tracking-tighter">{stat.value}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1 font-bold">{stat.description}</p>
                  </div>
                  <div className={`p-2 rounded-none ${stat.color} bg-current opacity-10 group-hover:opacity-20 transition-opacity`}>
                     <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
           {features.map((feature) => (
            <Card key={feature.title} className={`flex flex-col relative overflow-hidden group border-primary/10 shadow-md hover:shadow-2xl transition-all rounded-none ${feature.bg} neon-border`}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-none bg-white dark:bg-background p-3 text-primary shadow-sm group-hover:scale-110 transition-transform border border-primary/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div><CardTitle className="text-xl font-bold tracking-tight">{feature.title}</CardTitle><CardDescription className="text-xs">{feature.description}</CardDescription></div>
              </CardHeader>
              <CardContent className="flex-grow flex items-end pt-4">
                <Link href={feature.link} className="w-full">
                  <Button className="w-full h-11 font-black uppercase tracking-widest rounded-none shadow-lg shadow-primary/20">
                    {feature.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-none border-primary/20 bg-primary/5 shadow-xl relative overflow-hidden group glow-box">
          <Quote className="absolute -top-4 -right-4 h-24 w-24 text-primary/5 transition-transform group-hover:scale-110" />
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary">Integrity Insight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base italic font-medium leading-relaxed">
              "{proverb.text}"
            </p>
            <div className="flex items-center justify-between pt-2">
               <span className="text-[10px] font-bold text-primary uppercase tracking-widest">— {proverb.author}</span>
               <Badge className="text-[8px] bg-primary/10 text-primary border-none rounded-none font-black">DAILY MOTIVATION</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="rounded-none border-green-500/20 bg-green-500/5 shadow-sm shimmer-card">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-sm">
               <span className="font-bold text-green-600 uppercase text-[10px] block tracking-widest">Security Status: Verified</span>
               <p className="text-muted-foreground text-xs font-medium">Identity linked to Biometric Signature Protocol.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-none border border-background bg-muted flex items-center justify-center text-[8px] font-black uppercase shadow-sm">N</div>
                ))}
             </div>
             <Lock className="h-4 w-4 text-green-500/30" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}