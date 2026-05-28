"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useFirebase, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, ArrowRight, ShieldCheck, Zap, Users, Clock, Database, Lock, Fingerprint, Quote, Activity, Network } from "lucide-react";
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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<Voter>(userDocRef);

  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore || !profile?.isAdmin) return null;
    return collection(firestore, "users");
  }, [firestore, profile?.isAdmin]);
  
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<Voter>(usersCollectionRef);

  const stats = [
    {
      label: "Node Signature",
      value: profile?.id ? "VERIFIED" : "UNBOUND",
      description: "SHA-256 IDENTITY ACTIVE",
      icon: Fingerprint,
      color: "text-primary",
      glow: "rgba(0, 209, 255, 0.4)",
      isLoading: isProfileLoading
    },
    {
      label: "Mesh Consensus",
      value: "STABLE",
      description: "128 NODES (1.2S LATENCY)",
      icon: Network,
      color: "text-secondary",
      glow: "rgba(122, 92, 255, 0.4)",
      isLoading: false
    },
    {
      label: "Registry Load",
      value: profile?.isAdmin ? (allUsers?.length || "0") : "SECURE",
      description: profile?.isAdmin ? "GLOBAL UNIT COUNT" : "LOCAL CACHE SYNCED",
      icon: Users,
      color: "text-accent",
      glow: "rgba(0, 255, 178, 0.4)",
      isLoading: profile?.isAdmin ? isUsersLoading : false
    },
    {
      label: "Ledger Standard",
      value: "VVSG 2.0",
      description: "BLOCKCHAIN HARDENED",
      icon: Database,
      color: "text-primary",
      glow: "rgba(0, 209, 255, 0.4)",
      isLoading: false
    }
  ];

  const features = [
    {
      title: "Active Protocol Booth",
      description: "Secure, anonymous biometric-signed ballot submission.",
      link: "/dashboard/vote",
      icon: Vote,
      cta: "INITIATE PROTOCOL",
      bg: "bg-primary/5",
      border: "border-primary/20",
      iconColor: "text-primary"
    },
    {
      title: "Integrity Audit Hub",
      description: "Cross-reference ballot receipts against the global mesh.",
      link: "/dashboard/verify",
      icon: ShieldCheck,
      cta: "EXECUTE AUDIT",
      bg: "bg-accent/5",
      border: "border-accent/20",
      iconColor: "text-accent"
    },
  ];

  return (
    <div className="flex flex-col gap-8 cyber-grid min-h-screen p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter glow-text uppercase">Station <span className="text-primary italic">Dashboard</span></h1>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Decentralized Voting Node Monitoring Active</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 glassmorphic-card rounded-none border-primary/20 shadow-[0_0_15px_rgba(0,209,255,0.1)]">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Protocol Window: Live</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (stat.label !== "Registry Load" || profile?.isAdmin) && (
          <motion.div 
            key={stat.label}
            whileHover={{ y: -5 }}
            className="group"
          >
            <Card className="rounded-none border-white/5 glassmorphic-card shimmer-card group-hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <stat.icon className="w-24 h-24" />
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">{stat.label}</p>
                    {stat.isLoading ? (
                      <Skeleton className="h-8 w-24 bg-white/5" />
                    ) : (
                      <p className={`text-2xl font-black tracking-tighter ${stat.color} glow-text`}>{stat.value}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground/60 mt-2 font-black tracking-widest">{stat.description}</p>
                  </div>
                  <div className={`p-2.5 rounded-none ${stat.color} bg-white/5 border border-white/5 shadow-inner`}>
                     <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
              <div className="h-0.5 w-full bg-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full bg-current ${stat.color} opacity-40`} 
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
           {features.map((feature) => (
            <Card key={feature.title} className={`flex flex-col relative overflow-hidden group border-white/5 glassmorphic-card hover:border-primary/20 transition-all rounded-none ${feature.bg} neon-border shadow-2xl`}>
              <CardHeader className="flex flex-row items-center gap-6 p-8">
                <div className={`rounded-none bg-white/5 p-4 ${feature.iconColor} shadow-inner group-hover:scale-110 transition-transform duration-500 border border-white/5`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black tracking-tighter uppercase italic">{feature.title}</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">
                    {feature.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex items-end p-8 pt-0">
                <Link href={feature.link} className="w-full">
                  <Button className="w-full h-14 font-black uppercase tracking-[0.3em] rounded-none shadow-xl shadow-primary/10 bg-primary text-background hover:bg-primary/90">
                    {feature.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-none border-white/5 glassmorphic-card shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Quote className="h-20 w-20 text-secondary" />
          </div>
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">Integrity Insight</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <p className="text-lg italic font-medium leading-relaxed border-l-2 border-secondary/20 pl-4 py-2 text-foreground/90">
              "{proverb.text}"
            </p>
            <div className="flex flex-col gap-4">
               <span className="text-[9px] font-black text-secondary uppercase tracking-[0.3em]">— {proverb.author}</span>
               <div className="flex items-center gap-2">
                 <Badge className="text-[8px] bg-secondary/10 text-secondary border-none rounded-none font-black tracking-widest">STATION_MESSAGE_01</Badge>
                 <div className="h-px flex-grow bg-white/5" />
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="rounded-none border-accent/20 bg-accent/5 glassmorphic-card shadow-lg shimmer-card overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-none bg-accent/10 flex items-center justify-center border border-accent/20 shadow-[0_0_15px_rgba(0,255,178,0.1)]">
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
            <div className="space-y-1">
               <span className="font-black text-accent uppercase text-[11px] block tracking-[0.2em]">NODE STATUS: HARDENED</span>
               <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Identity Linked to Neural Protocol Cluster 01</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-none border border-background bg-white/5 flex items-center justify-center text-[10px] font-black uppercase shadow-inner text-primary/40">N</div>
                ))}
             </div>
             <Lock className="h-5 w-5 text-accent opacity-30" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}