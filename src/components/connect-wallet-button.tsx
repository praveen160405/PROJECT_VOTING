"use client";

import { useWeb3 } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function ConnectWalletButton() {
    const { connectWallet, address, error } = useWeb3();
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
                <span>{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</span>
            </div>
        );
    }

    return (
        <Button onClick={connectWallet}>
            Connect Wallet
        </Button>
    );
}
