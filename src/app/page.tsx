"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Quote, ShieldCheck, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { getRandomProverb } from "@/lib/proverbs";

export default function HomePage() {
  const [proverb, setProverb] = useState({ text: "", author: "" });

  useEffect(() => {
    setProverb(getRandomProverb());
  }, []);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8 cyber-grid overflow-hidden">
      <div className="max-w-4xl w-full flex flex-col items-center gap-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 w-full"
        >
          <div className="p-12 glassmorphic-card rounded-none border-l-4 border-l-primary relative group shadow-2xl">
            <Quote className="h-10 w-10 text-primary/20 mb-6 mx-auto" />
            <p className="text-2xl md:text-4xl italic font-medium text-foreground leading-tight tracking-tight">
              "{proverb.text}"
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
               <div className="h-px w-8 bg-primary/40" />
               <p className="text-xs text-primary font-black uppercase tracking-[0.4em]">{proverb.author}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="glassmorphic-card rounded-none border-t-4 border-t-primary shadow-2xl overflow-hidden shimmer-card">
            <CardHeader className="items-center p-10">
              <Logo className="scale-[1.5]" />
              <CardDescription className="text-xs font-bold text-muted-foreground pt-6 uppercase tracking-widest">
                Decentralized Protocol Access
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 px-10 pb-10">
              <Link href="/login" className="w-full">
                 <Button className="w-full h-16 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-background rounded-none">
                  <LogIn className="h-5 w-5 mr-2" />
                  Enter Station
                </Button>
              </Link>
              <Link href="/register" className="w-full">
                <Button variant="outline" className="w-full h-14 text-xs font-bold uppercase tracking-widest rounded-none border-primary/20 text-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Onboard Identity
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <footer className="mt-20 text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.5em] flex items-center gap-8">
        <span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> VVSG 2.0 COMPLIANT</span>
        <span className="flex items-center gap-2"><Activity className="h-3 w-3" /> 128 ACTIVE NODES</span>
      </footer>
    </main>
  );
}