"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Quote, ShieldCheck, Activity, Network } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { getRandomProverb } from "@/lib/proverbs";

export default function HomePage() {
  const [proverb, setProverb] = useState({ text: "", author: "" });

  useEffect(() => {
    setProverb(getRandomProverb());
  }, []);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8 cyber-grid overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/20 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="max-w-4xl w-full flex flex-col items-center gap-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 w-full"
        >
          <div className="p-12 glassmorphic-card rounded-2xl border-l-4 border-l-primary relative group shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Network className="h-32 w-32 text-primary" />
            </div>
            <Quote className="h-10 w-10 text-primary/40 mb-6 mx-auto" />
            <p className="text-2xl md:text-5xl italic font-black text-foreground leading-tight tracking-tighter glow-text">
              "{proverb.text}"
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
               <div className="h-px w-12 bg-primary/40" />
               <p className="text-sm text-primary font-black uppercase tracking-[0.5em]">{proverb.author}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="glassmorphic-card rounded-3xl border-t-4 border-t-primary shadow-[0_0_50px_rgba(0,209,255,0.1)] overflow-hidden shimmer-card">
            <CardHeader className="items-center p-10 pt-12">
              <Logo className="scale-[1.8] mb-4" />
              <CardDescription className="text-xs font-black text-primary/70 pt-6 uppercase tracking-[0.4em]">
                Protocol Access Terminal
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 px-10 pb-12">
              <Link href="/login" className="w-full">
                 <Button className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 text-background rounded-2xl shadow-xl shadow-primary/20">
                  <LogIn className="h-5 w-5 mr-2" />
                  Enter Station
                </Button>
              </Link>
              <Link href="/register" className="w-full">
                <Button variant="outline" className="w-full h-14 text-xs font-black uppercase tracking-[0.3em] rounded-2xl border-primary/30 text-primary hover:bg-primary/5">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Identity Sync
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <footer className="mt-24 text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.6em] flex items-center gap-12 relative z-10">
        <span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-accent" /> VVSG 2.0 COMPLIANT</span>
        <span className="flex items-center gap-2"><Activity className="h-3 w-3 text-secondary" /> 128 ACTIVE NODES</span>
      </footer>
    </main>
  );
}