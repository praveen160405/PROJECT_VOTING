"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Wallet, ShieldCheck, Zap, Globe, Quote, ChevronRight, Activity, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { getRandomProverb } from "@/lib/proverbs";

export default function HomePage() {
  const [proverb, setProverb] = useState({ text: "", author: "" });

  useEffect(() => {
    setProverb(getRandomProverb());
  }, []);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8 cyber-grid overflow-hidden">
      {/* Animated Background Glows */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="max-w-6xl w-full grid gap-12 lg:grid-cols-2 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="flex flex-wrap gap-3">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 uppercase tracking-widest font-black rounded-none backdrop-blur-sm">
               Secure Blockchain Protocol
             </Badge>
             <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 px-4 py-1.5 uppercase tracking-widest font-black flex items-center gap-2 rounded-none backdrop-blur-sm">
               <ShieldCheck className="h-4 w-4" /> Consensus Node v2.1
             </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none glow-text">
            OOTU <span className="text-primary italic">PROTOCOL</span>
          </h1>

          <div className="p-8 glassmorphic-card rounded-none border-l-4 border-l-primary relative group overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
               <Database className="w-48 h-48 text-primary" />
            </div>
            <Quote className="h-10 w-10 text-primary/20 mb-4" />
            <p className="text-xl md:text-2xl italic font-medium text-foreground relative z-10 leading-relaxed tracking-tight">
              "{proverb.text}"
            </p>
            <div className="mt-6 flex items-center gap-3">
               <div className="h-px w-8 bg-primary/40" />
               <p className="text-xs text-primary font-black uppercase tracking-[0.4em]">{proverb.author}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Network Status</p>
                <div className="flex items-center gap-2 text-primary font-bold">
                   <Activity className="h-4 w-4" /> 128 ACTIVE NODES
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Integrity Level</p>
                <div className="flex items-center gap-2 text-accent font-bold">
                   <ShieldCheck className="h-4 w-4" /> SHA-256 HARDENED
                </div>
             </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="glassmorphic-card rounded-none border-t-4 border-t-primary shadow-2xl overflow-hidden shimmer-card">
            <CardHeader className="items-center text-center p-10">
              <Logo className="mb-2 scale-[2.0] text-primary" />
              <CardDescription className="text-sm font-bold text-muted-foreground pt-10 uppercase tracking-[0.25em] leading-relaxed max-w-[280px]">
                Access the decentralized mission control to exercise your digital sovereignty.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-10 pt-0">
              <Link href="/login">
                 <Button size="lg" className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] gap-3 bg-primary hover:bg-primary/90 text-background rounded-none shadow-[0_0_20px_rgba(0,209,255,0.4)]">
                  <LogIn className="h-5 w-5" />
                  Enter Station
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] gap-3 hover:bg-primary/5 transition-all rounded-none border-primary/20 text-primary">
                  <UserPlus className="h-5 w-5" />
                  Onboard Identity
                </Button>
              </Link>
            </CardContent>
            
            <div className="relative px-10">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-primary/10" />
              </div>
              <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.5em]">
                  <span className="bg-card px-4 text-primary/40">
                  Secure Wallet Access
                  </span>
              </div>
            </div>

            <CardFooter className="p-10">
              <Link href="/wallet-connect" className="w-full">
                  <Button variant="secondary" size="lg" className="w-full h-12 gap-3 rounded-none font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10">
                      <Wallet className="h-4 w-4 text-secondary" />
                      Connect Web3 Identity
                  </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      <footer className="mt-20 text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.5em] flex items-center gap-8">
        <span>ESTABLISHED 2024</span>
        <div className="h-1 w-1 rounded-full bg-primary/20" />
        <span>VVSG 2.0 COMPLIANT</span>
        <div className="h-1 w-1 rounded-full bg-primary/20" />
        <span>SHA-256 ENCRYPTED</span>
      </footer>
    </main>
  );
}