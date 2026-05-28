"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Wallet, ShieldCheck, Zap, Globe, Quote } from "lucide-react";
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
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full grid gap-8 lg:grid-cols-2 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-2 mb-4">
             <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 uppercase tracking-tighter font-black rounded-none">
               Protocol V2.1 Active
             </Badge>
             <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1 uppercase tracking-tighter font-black flex items-center gap-1 rounded-none">
               <ShieldCheck className="h-3 w-3" /> Secure Consensus
             </Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
            DECENTRALIZED <br />
            <span className="text-primary italic">INTEGRITY.</span>
          </h1>
          <p className="text-lg font-medium text-muted-foreground leading-relaxed max-w-sm">
            The OOTU Protocol ensures every ballot is immutable, anonymized, and protected by the world's first Anti-Coercion Suite.
          </p>

          <div className="p-6 bg-primary/5 backdrop-blur-md border-l-4 border-primary rounded-none relative overflow-hidden group">
            <Quote className="absolute -top-2 -left-2 h-12 w-12 text-primary/10 group-hover:scale-110 transition-transform" />
            <p className="text-lg italic font-medium text-foreground relative z-10 leading-relaxed">
              "{proverb.text}"
            </p>
            <p className="text-[10px] text-primary font-black mt-3 uppercase tracking-[0.2em]">— {proverb.author}</p>
          </div>

          <div className="flex flex-wrap gap-6 pt-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               <Zap className="h-4 w-4 text-primary" /> 128 Active Nodes
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               <Globe className="h-4 w-4 text-accent" /> Global Ledger
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glassmorphic-card glow-box rounded-none shadow-2xl overflow-hidden">
            <CardHeader className="items-center text-center p-8">
              <Logo className="mb-2 scale-150" />
              <CardDescription className="text-sm font-medium text-muted-foreground pt-6 uppercase tracking-widest leading-relaxed">
                Identity access required <br /> for decentralized participation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-8 pt-0">
              <Link href="/login">
                 <Button size="lg" className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] gap-3 shadow-xl shadow-primary/20 rounded-none">
                  <LogIn className="h-5 w-5" />
                  Voter Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] gap-3 hover:bg-primary/5 transition-colors rounded-none border-primary/20">
                  <UserPlus className="h-5 w-5" />
                  Register ID
                </Button>
              </Link>
            </CardContent>
             <div className="relative px-8">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-primary/10" />
              </div>
              <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.4em]">
                  <span className="bg-card px-4 text-primary">
                  Blockchain Sync
                  </span>
              </div>
            </div>
            <CardFooter className="p-8">
              <Link href="/wallet-connect" className="w-full">
                  <Button variant="secondary" size="lg" className="w-full h-12 gap-3 rounded-none font-bold uppercase tracking-widest">
                      <Wallet className="h-4 w-4" />
                      Connect Wallet
                  </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      <footer className="mt-16 text-[8px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-40">
        OOTU PROTOCOL • VVSG 2.0 COMPLIANT • SHA-256 ENCRYPTED • NEURAL SYNC ACTIVE
      </footer>
    </main>
  );
}