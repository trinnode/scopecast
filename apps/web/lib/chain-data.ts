import { createPublicClient, http, decodeEventLog, getAddress, type PublicClient } from "viem";
import { addresses, rpcUrls, baseSepolia, unichainSepolia, lasna, POLICY_UPDATED_TOPIC, SYSTEM_CONTRACT, CALLBACK_PROXY } from "./config";
import { policyHubAbi, mirrorAbi, vaultAbi } from "./contracts";

export type SourceEvent = {
  agentId: `0x${string}`;
  agent: `0x${string}`;
  epoch: number;
  destinationChainId: bigint;
  destinationModule: `0x${string}`;
  allowedSelector: `0x${string}`;
  maxValue: bigint;
  expiresAt: number;
  active: boolean;
  policyHash: `0x${string}`;
  txHash: `0x${string}`;
  blockNumber: bigint;
};

type AnyClient = PublicClient;

const baseClient: AnyClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrls.base, { timeout: 10_000 }) });
const unichainClient: AnyClient = createPublicClient({ chain: unichainSepolia, transport: http(rpcUrls.unichain, { timeout: 10_000 }) });
const lasnaClient: AnyClient = createPublicClient({ chain: lasna, transport: http(rpcUrls.lasna, { timeout: 20_000 }) });

export async function readSourceEvents(): Promise<SourceEvent[]> {
  if (!addresses.policyHub) return [];
  try {
    const latest = await baseClient.getBlockNumber();
    const from = latest > 200_000n ? latest - 200_000n : 0n;
    const allLogs = await baseClient.getLogs({ address: addresses.policyHub, fromBlock: from, toBlock: latest });
    const logs = allLogs.filter((log) => log.topics[0] === POLICY_UPDATED_TOPIC);
    return logs.map((log) => {
      const decoded = decodeEventLog({ abi: policyHubAbi, data: log.data, topics: log.topics, eventName: "PolicyUpdated" });
      const a = decoded.args as unknown as Record<string, unknown>;
      return {
        agentId: a.agentId as `0x${string}`,
        agent: a.agent as `0x${string}`,
        epoch: Number(a.epoch),
        destinationChainId: a.destinationChainId as bigint,
        destinationModule: a.destinationModule as `0x${string}`,
        allowedSelector: a.allowedSelector as `0x${string}`,
        maxValue: a.maxValue as bigint,
        expiresAt: Number(a.expiresAt),
        active: a.active as boolean,
        policyHash: a.policyHash as `0x${string}`,
        txHash: log.transactionHash!,
        blockNumber: log.blockNumber,
      };
    });
  } catch {
    return [];
  }
}

export async function readMirrorPolicy(agentId: `0x${string}`) {
  if (!addresses.policyMirror) return null;
  try {
    return await unichainClient.readContract({
      address: addresses.policyMirror,
      abi: mirrorAbi,
      functionName: "getPolicy",
      args: [agentId],
    });
  } catch {
    return null;
  }
}

export async function readVaultPositions() {
  if (!addresses.guardedVault) return null;
  try {
    const result = await unichainClient.readContract({
      address: addresses.guardedVault,
      abi: vaultAbi,
      functionName: "positions",
    });
    return { idle: result[0], strategy: result[1] };
  } catch {
    return null;
  }
}

export async function readVaultEvents() {
  if (!addresses.guardedVault) return [] as Array<{ txHash: `0x${string}`; agentId: `0x${string}`; amount: bigint; epoch: number }>;
  try {
    const latest = await unichainClient.getBlockNumber();
    const from = latest > 200_000n ? latest - 200_000n : 0n;
    const logs = await unichainClient.getLogs({ address: addresses.guardedVault, fromBlock: from, toBlock: latest });
    const actionTopic = "0x" as const;
    void actionTopic;
    const out: Array<{ txHash: `0x${string}`; agentId: `0x${string}`; amount: bigint; epoch: number }> = [];
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({ abi: vaultAbi, data: log.data, topics: log.topics, eventName: "ActionExecuted" });
        const a = decoded.args as unknown as Record<string, unknown>;
        out.push({
          txHash: log.transactionHash!,
          agentId: a.agentId as `0x${string}`,
          amount: a.amount as bigint,
          epoch: Number(a.epoch),
        });
      } catch {
        /* unrelated event from the same address */
      }
    }
    return out;
  } catch {
    return [];
  }
}

export type Diagnostic = { name: string; value: string; ok: boolean; detail?: string };

export async function readDiagnostics(): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  const chainId = async (client: AnyClient, expected: number, name: string) => {
    try {
      const id = await client.getChainId();
      out.push({ name, value: String(id), ok: id === expected, detail: `expected ${expected}` });
    } catch (e) {
      out.push({ name, value: "unreachable", ok: false, detail: String(e).slice(0, 80) });
    }
  };
  await chainId(baseClient, 84532, "Base Sepolia chain ID");
  await chainId(unichainClient, 1301, "Unichain Sepolia chain ID");
  await chainId(lasnaClient, 5318007, "Reactive Lasna chain ID");

  const codeCheck = async (client: AnyClient, address: `0x${string}`, name: string) => {
    try {
      const code = await client.getCode({ address });
      out.push({ name, value: code && code !== "0x" ? `deployed (${(code.length - 2) / 2} bytes)` : "no code", ok: !!code && code !== "0x" });
    } catch {
      out.push({ name, value: "check failed", ok: false });
    }
  };
  if (addresses.policyHub) await codeCheck(baseClient, addresses.policyHub, "PolicyHub bytecode");
  if (addresses.policyMirror) await codeCheck(unichainClient, addresses.policyMirror, "PolicyMirror bytecode");
  if (addresses.guardedVault) await codeCheck(unichainClient, addresses.guardedVault, "GuardedDeFiVault bytecode");
  if (addresses.reactive) await codeCheck(lasnaClient, addresses.reactive, "ScopeCastReactive bytecode");

  await codeCheck(lasnaClient, getAddress(SYSTEM_CONTRACT), "Lasna system contract");
  await codeCheck(unichainClient, getAddress(CALLBACK_PROXY.unichain), "Unichain callback proxy");

  if (addresses.policyMirror) {
    try {
      const balance = await unichainClient.getBalance({ address: addresses.policyMirror });
      out.push({
        name: "Callback receiver gas reserve",
        value: `${(Number(balance) / 1e18).toFixed(6)} ETH`,
        ok: balance > 0n,
        detail: "destination native token pays callback execution",
      });
    } catch {
      out.push({ name: "Callback receiver gas reserve", value: "unavailable", ok: false });
    }
  }
  return out;
}
