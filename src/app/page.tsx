"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { useWeb3 } from "@/app/providers";

export default function ConnectWalletPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { connectWallet, address, error, isLoading } = useWeb3();

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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
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
          <CardContent className="flex flex-col items-center justify-center p-6 pt-2">
            <p className="mb-8 text-center text-muted-foreground">
              Connect your Web3 wallet to participate in the election.
            </p>
            <Button
              onClick={handleConnect}
              size="lg"
              className="w-full text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </>
              )}
            </Button>
            <p className="mt-8 text-center text-xs text-muted-foreground/80">
              By connecting your wallet, you agree to our Terms of Service.
              <br />
              Ensure you have a wallet like MetaMask installed.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
