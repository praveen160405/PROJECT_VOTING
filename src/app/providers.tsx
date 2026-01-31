"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { votingContractAddress, votingContractABI } from '@/lib/contract';

// Web3 Context
interface Web3ContextType {
  address: string | null;
  connectWallet: () => Promise<void>;
  error: string | null;
  contract: Contract | null;
  provider: BrowserProvider | null;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

// Web3 Provider Component
const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const connectWallet = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    if (typeof window.ethereum !== 'undefined') {
      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        // It's recommended to request accounts, which also prompts the user to connect.
        const signer = await browserProvider.getSigner();
        const userAddress = await signer.getAddress();
        
        setAddress(userAddress);
        setProvider(browserProvider);

        const votingContract = new Contract(votingContractAddress, votingContractABI, signer);
        setContract(votingContract);

      } catch (err: any) {
        console.error("Wallet connection error:", err);
        if (err.code === -32002) {
          setError("Connection request already pending. Please check your wallet.");
        } else {
          setError(err.reason || err.message || "Failed to connect wallet.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("MetaMask is not installed. Please install it to use this feature.");
      setIsLoading(false);
    }
  }, [isLoading]);
  
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          // Re-connect to get the new signer and update the address
          connectWallet();
        } else {
          // Handle disconnection
          setAddress(null);
          setContract(null);
          setProvider(null);
        }
      });

      // On initial load, if a wallet is already connected, try to establish connection silently
      const connectSilently = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      }
      connectSilently();
    }
  }, [connectWallet]);

  return (
    <Web3Context.Provider value={{ address, connectWallet, error, contract, provider, isLoading }}>
      {children}
    </Web3Context.Provider>
  );
};


// Main AppProviders component
export function AppProviders({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Web3Provider>
        {children}
      </Web3Provider>
    </NextThemesProvider>
  );
}
