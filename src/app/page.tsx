"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Logo } from "@/components/logo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <Card className="glassmorphic-card shadow-2xl">
          <CardHeader className="items-center text-center p-6">
            <Logo className="mb-4" />
            <CardTitle className="text-3xl font-bold tracking-tight">
              Welcome to VerityVote
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Your secure & transparent voting platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full h-full flex flex-col py-6">
                <Mail className="h-8 w-8 mb-2" />
                <span className="font-semibold">Sign In with Email</span>
              </Button>
            </Link>
            <Link href="/wallet-connect">
               <Button size="lg" className="w-full h-full flex flex-col py-6">
                <Wallet className="h-8 w-8 mb-2" />
                <span className="font-semibold">Connect Wallet</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
