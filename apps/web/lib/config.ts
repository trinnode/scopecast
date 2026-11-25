import { defineChain } from "viem";

export const BASE_SEPOLIA_ID = 84532;
export const UNICHAIN_SEPOLIA_ID = 1301;
export const LASNA_ID = 5318007;

export const baseSepolia = defineChain({
  id: BASE_SEPOLIA_ID,
  name: "Base Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://base-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Basescan", url: "https://sepolia.basescan.org" },
  },
  testnet: true,
});

export const unichainSepolia = defineChain({
  id: UNICHAIN_SEPOLIA_ID,
  name: "Unichain Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.unichain.org"] },
  },
  blockExplorers: {
    default: { name: "Uniscan", url: "https://sepolia.uniscan.xyz" },
  },
  testnet: true,
});

export const lasna = defineChain({
  id: LASNA_ID,
  name: "Reactive Lasna",
  nativeCurrency: { name: "REACT", symbol: "REACT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://lasna-rpc.rnk.dev/"] },
  },
  blockExplorers: {
    default: { name: "ReactScan", url: "https://lasna.reactscan.net" },
  },
  testnet: true,
});

function addr(value: string | undefined): `0x${string}` | null {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value.trim())) return null;
  return value.trim() as `0x${string}`;
}

export const addresses = {
  policyHub: addr(process.env.NEXT_PUBLIC_POLICY_HUB_ADDRESS),
  reactive: addr(process.env.NEXT_PUBLIC_REACTIVE_CONTRACT_ADDRESS),
  policyMirror: addr(process.env.NEXT_PUBLIC_POLICY_MIRROR_ADDRESS),
  guardedVault: addr(process.env.NEXT_PUBLIC_GUARDED_VAULT_ADDRESS),
  token: addr(process.env.NEXT_PUBLIC_TOKEN_ADDRESS),
};

export const rpcUrls = {
  base: process.env.NEXT_PUBLIC_BASE_RPC_URL || baseSepolia.rpcUrls.default.http[0],
  unichain: process.env.NEXT_PUBLIC_UNICHAIN_RPC_URL || unichainSepolia.rpcUrls.default.http[0],
  lasna: process.env.NEXT_PUBLIC_LASNA_RPC_URL || lasna.rpcUrls.default.http[0],
};

export const explorers = {
  base: process.env.NEXT_PUBLIC_BASE_EXPLORER_URL || "https://sepolia.basescan.org",
  unichain: process.env.NEXT_PUBLIC_UNICHAIN_EXPLORER_URL || "https://sepolia.uniscan.xyz",
  lasna: process.env.NEXT_PUBLIC_REACTSCAN_URL || "https://lasna.reactscan.net",
};

export function txUrl(chain: "base" | "unichain" | "lasna", hash: string) {
  return `${explorers[chain]}/tx/${hash}`;
}

export function addressUrl(chain: "base" | "unichain" | "lasna", address: string) {
  return `${explorers[chain]}/address/${address}`;
}

export const SYSTEM_CONTRACT = "0x8888888888888888888888888888888888888888" as const;
export const CALLBACK_PROXY = {
  base: "0x476F44b11F5C942c58f4c8E3d0300E5710743585" as const,
  unichain: "0x775c9B990ADe401060B78D0e98684eEf8d2466C1" as const,
};

/// keccak256("PolicyUpdated(bytes32,address,uint64,uint256,address,bytes4,uint256,uint64,bool,bytes32)")
export const POLICY_UPDATED_TOPIC = "0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9" as const;
