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
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 uppercase tracking-tighter font-bold">
               Protocol V2.1 Active
             </Badge>
             <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-500/20 px-3 py-1 uppercase tracking-tighter font-bold flex items-center gap-1">
               <ShieldCheck className="h-3 w-3" /> Secure Consensus
             </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
            DECENTRALIZED <span className="text-primary italic">INTEGRITY.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
            The OOTU Protocol ensures every ballot is immutable, anonymized, and protected by the world's first Anti-Coercion Suite.
          </p>

          <div className="p-6 bg-card/40 backdrop-blur-md border border-primary/10 rounded-2xl relative overflow-hidden group">
            <Quote className="absolute -top-2 -left-2 h-12 w-12 text-primary/10 group-hover:scale-110 transition-transform" />
            <p className="text-lg italic font-medium text-foreground relative z-10">
              "{proverb.text}"
            </p>
            <p className="text-sm text-primary font-bold mt-2 uppercase tracking-widest">— {proverb.author}</p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
               <Zap className="h-4 w-4 text-yellow-500" /> 128 Active Nodes
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
               <Globe className="h-4 w-4 text-blue-500" /> Global Ledger
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glassmorphic-card shadow-2xl border-primary/10">
            <CardHeader className="items-center text-center p-8">
              <Logo className="mb-2 scale-125" />
              <CardDescription className="text-base text-muted-foreground pt-4">
                Access your secure voter portal to participate in the OOTU network.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 p-8 pt-0">
              <Link href="/login">
                 <Button size="lg" className="w-full h-14 text-lg font-bold gap-3 shadow-lg shadow-primary/20">
                  <LogIn className="h-6 w-6" />
                  Voter Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="w-full h-14 text-lg font-bold gap-3 hover:bg-primary/5 transition-colors">
                  <UserPlus className="h-6 w-6" />
                  Register Identity
                </Button>
              </Link>
            </CardContent>
             <div className="relative px-8">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-primary/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">
                  Blockchain Sync
                  </span>
              </div>
            </div>
            <CardFooter className="p-8">
              <Link href="/wallet-connect" className="w-full">
                  <Button variant="secondary" size="lg" className="w-full h-12 gap-3">
                      <Wallet className="h-5 w-5" />
                      Continue with Wallet
                  </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      
      <footer className="mt-16 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-40">
        OOTU PROTOCOL • VVSG 2.0 COMPLIANT • SHA-256 ENCRYPTED
      </footer>
    </main>
  );
}
