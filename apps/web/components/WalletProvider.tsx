"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createWalletClient, custom, type WalletClient, type Hex } from "viem";
import { baseSepolia, unichainSepolia } from "@/lib/config";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193;
  }
}

type WalletState = {
  address: `0x${string}` | null;
  chainId: number | null;
  connecting: boolean;
  connect: () => Promise<void>;
  switchToBase: () => Promise<void>;
  switchToUnichain: () => Promise<void>;
  client: WalletClient | null;
  error: string | null;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<WalletClient | null>(null);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    const refresh = async () => {
      try {
        const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
        const id = (await eth.request({ method: "eth_chainId" })) as Hex;
        if (accounts?.[0]) {
          setAddress(accounts[0] as `0x${string}`);
          setClient(createWalletClient({ transport: custom(eth) }));
        }
        setChainId(Number(id));
      } catch {
        /* wallet unavailable — keep the console in read-only mode */
      }
    };
    void refresh();
    const handler = () => void refresh();
    eth.on?.("accountsChanged", handler);
    eth.on?.("chainChanged", handler);
    return () => {
      eth.removeListener?.("accountsChanged", handler);
      eth.removeListener?.("chainChanged", handler);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      setError("No injected wallet found. Install a browser wallet to sign testnet transactions.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const id = (await eth.request({ method: "eth_chainId" })) as Hex;
      if (accounts?.[0]) {
        setAddress(accounts[0] as `0x${string}`);
        setClient(createWalletClient({ transport: custom(eth) }));
      }
      setChainId(Number(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection refused");
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchChain = useCallback(async (target: typeof baseSepolia | typeof unichainSepolia) => {
    const eth = window.ethereum;
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${target.id.toString(16)}` }],
      });
      setChainId(target.id);
    } catch {
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${target.id.toString(16)}`,
              chainName: target.name,
              nativeCurrency: target.nativeCurrency,
              rpcUrls: target.rpcUrls.default.http,
              blockExplorerUrls: [target.blockExplorers.default.url],
            },
          ],
        });
        setChainId(target.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not switch network");
      }
    }
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      address,
      chainId,
      connecting,
      connect,
      switchToBase: () => switchChain(baseSepolia),
      switchToUnichain: () => switchChain(unichainSepolia),
      client,
      error,
    }),
    [address, chainId, connecting, connect, switchChain, client, error],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
