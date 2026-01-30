"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

// Ethers and Web3 context
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  connectWallet: () => Promise<void>;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};


export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setError(null);
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new BrowserProvider(window.ethereum);
        const signer = await web3Provider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(web3Provider);
        setSigner(signer);
        setAddress(address);
      } catch (err: any) {
        console.error("Error connecting wallet:", err);
        setError(err.message || 'Failed to connect wallet.');
      }
    } else {
      setError("Please install MetaMask to use this feature.");
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length > 0) {
                connectWallet();
            } else {
                setAddress(null);
                setSigner(null);
                setProvider(null);
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        return () => {
            if (window.ethereum.removeListener) {
              window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }
  }, []);

  return (
    <Web3Context.Provider value={{ provider, signer, address, connectWallet, error }}>
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
