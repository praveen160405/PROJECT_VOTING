"use client";

import { useWeb3 } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Wallet, Loader2 } from "lucide-react";

export function ConnectWalletButton() {
    const { connectWallet, address, error, isLoading } = useWeb3();
    const { toast } = useToast();

    useEffect(() => {
        if (error) {
            toast({
                variant: "destructive",
                title: "Wallet Error",
                description: error,
            });
        }
    }, [error, toast]);

    if (address) {
        return (
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm">
                <Wallet className="h-4 w-4 text-green-500" />
                <span>{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</span>
            </div>
        );
    }

    return (
        <Button onClick={connectWallet} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
    );
}
