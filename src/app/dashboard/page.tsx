"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useFirebase, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, ShieldCheck, Users, Fingerprint, Quote, Activity, Network } from "lucide-react";
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

  const stats = [
    { label: "Node Signature", value: profile?.id ? "VERIFIED" : "UNBOUND", icon: Fingerprint, color: "text-primary" },
    { label: "Mesh Consensus", value: "STABLE", icon: Network, color: "text-secondary" },
    { label: "Protocol Standard", value: "VVSG 2.0", icon: ShieldCheck, color: "text-accent" },
  ];

  return (
    <div className="flex flex-col gap-8 p-2 md:p-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic">Station <span className="text-primary">Dashboard</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Active Node Monitoring</p>
        </div>
        <Badge variant="outline" className="h-10 px-4 rounded-none border-primary/20 bg-primary/5 text-primary gap-2">
           <Activity className="h-4 w-4 animate-pulse" />
           <span className="font-black uppercase text-[10px] tracking-widest">Protocol: Live</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <Card key={s.label} className="glassmorphic-card rounded-none border-white/5 shimmer-card">
            <CardContent className="p-8 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase text-muted-foreground mb-2">{s.label}</p>
                <p className={`text-2xl font-black italic ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`h-8 w-8 ${s.color} opacity-30`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glassmorphic-card rounded-none border-primary/20 bg-primary/5 flex flex-col justify-between">
            <CardHeader className="p-8 pb-4">
              <Vote className="h-8 w-8 text-primary mb-4" />
              <CardTitle className="text-xl font-black uppercase italic">Voting Booth</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Secure, anonymous ballot submission.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Link href="/dashboard/vote"><Button className="w-full h-12 rounded-none uppercase font-black tracking-widest bg-primary text-background">Initiate Protocol</Button></Link>
            </CardContent>
          </Card>
          <Card className="glassmorphic-card rounded-none border-accent/20 bg-accent/5 flex flex-col justify-between">
            <CardHeader className="p-8 pb-4">
              <ShieldCheck className="h-8 w-8 text-accent mb-4" />
              <CardTitle className="text-xl font-black uppercase italic">Audit Hub</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Cross-reference ballot receipts.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Link href="/dashboard/verify"><Button className="w-full h-12 rounded-none uppercase font-black tracking-widest bg-accent text-background">Execute Audit</Button></Link>
            </CardContent>
          </Card>
        </div>

        <Card className="glassmorphic-card rounded-none border-white/5 p-8 flex flex-col gap-6">
          <p className="text-[10px] font-black uppercase text-secondary tracking-[0.4em]">Integrity Insight</p>
          <p className="text-xl italic font-medium leading-tight">"{proverb.text}"</p>
          <p className="text-[10px] font-black uppercase text-secondary">— {proverb.author}</p>
        </Card>
      </div>
    </div>
  );
}