"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { useWeb3 } from "@/app/providers";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { connectWallet, address, error } = useWeb3();

  useEffect(() => {
    if (address) {
      toast({
        title: "Wallet Connected",
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
    }
  }, [address, router, toast]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error,
      });
    }
  }, [error, toast]);

  const handleConnect = async () => {
    await connectWallet();
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md glassmorphic-card shadow-2xl">
          <CardHeader className="items-center text-center">
            <Logo className="mb-2" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome to VerityVote
            </h1>
            <p className="text-muted-foreground">
              A secure, transparent, and immutable voting platform.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <p className="mb-6 text-center text-muted-foreground">
              Connect your wallet to access the dashboard and cast your vote.
            </p>
            <Button onClick={handleConnect} size="lg" className="w-full">
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </Button>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              This platform uses a decentralized blockchain for voting.
              <br />
              Ensure you have a Web3 wallet like MetaMask installed.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
