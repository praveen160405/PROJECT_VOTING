"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Wallet } from "lucide-react";

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
              Welcome to OOTU
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Your secure & transparent voting platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <Link href="/register">
              <Button variant="outline" size="lg" className="w-full h-full flex flex-col py-6">
                <UserPlus className="h-8 w-8 mb-2" />
                <span className="font-semibold">Register New Voter</span>
              </Button>
            </Link>
            <Link href="/login">
               <Button size="lg" className="w-full h-full flex flex-col py-6">
                <LogIn className="h-8 w-8 mb-2" />
                <span className="font-semibold">Voter Login</span>
              </Button>
            </Link>
          </CardContent>
           <div className="relative px-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                Or
                </span>
            </div>
          </div>
          <CardFooter className="p-6">
            <Link href="/wallet-connect" className="w-full">
                <Button variant="secondary" size="lg" className="w-full">
                    <Wallet className="mr-2 h-5 w-5" />
                    Continue with Wallet
                </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
