"use client";

import { useEffect, useState } from "react";
import { createPublicClient, createWalletClient, http, parseUnits, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Card, EmptyState, ExplorerLink, Mono, Overline, PageHeader, StatusChip } from "@/components/ui";
import { truncateHex } from "@/lib/format";
import { readMirrorPolicy, readVaultPositions, type SourceEvent } from "@/lib/chain-data";
import { readSourceEvents } from "@/lib/chain-data";
import { deriveStatus } from "@/lib/status";
import { vaultAbi } from "@/lib/contracts";
import { addresses, rpcUrls, txUrl, unichainSepolia } from "@/lib/config";

export default function GuardedDemo() {
  const [events, setEvents] = useState<SourceEvent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [key, setKey] = useState("");
  const [amount, setAmount] = useState("1");
  const [positions, setPositions] = useState<{ idle: bigint; strategy: bigint } | null>(null);
  const [epoch, setEpoch] = useState<number | null>(null);
  const [active, setActive] = useState<boolean | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [kind, setKind] = useState<"success" | "simulation" | "error" | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async (id: string) => {
    const p = await readMirrorPolicy(id as `0x${string}`);
    if (p) {
      setEpoch(Number(p.epoch));
      setActive(p.active);
    } else {
      setEpoch(null);
      setActive(null);
    }
    setPositions(await readVaultPositions());
  };

  useEffect(() => {
    void readSourceEvents().then(({ events: list }) => {
      const latest = new Map<string, SourceEvent>();
      for (const e of list) if (!latest.has(e.agentId) || e.epoch > latest.get(e.agentId)!.epoch) latest.set(e.agentId, e);
      const rows = [...latest.values()];
      setEvents(rows);
      const first = rows[0]?.agentId ?? "";
      setAgentId(first);
      if (first) void refresh(first);
    });
  }, []);

  const status = deriveStatus(active, epoch, events.find((e) => e.agentId === agentId)?.epoch ?? null);

  async function run(submit: boolean) {
    setResult(null);
    setKind(null);
    if (!key || !agentId || !addresses.guardedVault) {
      setResult("Enter an ephemeral test agent key and select a policy.");
      setKind("error");
      return;
    }
    setBusy(true);
    try {
      const account = privateKeyToAccount(key as Hex);
      const publicClient = createPublicClient({ chain: unichainSepolia, transport: http(rpcUrls.unichain) });
      const args: [`0x${string}`, bigint] = [agentId as `0x${string}`, parseUnits(amount, 18)];
      if (!submit) {
        await publicClient.simulateContract({
          address: addresses.guardedVault,
          abi: vaultAbi,
          functionName: "rebalance",
          args,
          account,
        });
        setResult("eth_call simulation succeeded: the guarded module accepted the action at the current destination epoch.");
        setKind("success");
      } else {
        const walletClient = createWalletClient({ account, chain: unichainSepolia, transport: http(rpcUrls.unichain) });
        const hash = await walletClient.writeContract({
          address: addresses.guardedVault,
          abi: vaultAbi,
          functionName: "rebalance",
          args,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setResult(`Action confirmed on Unichain Sepolia. ${hash}`);
        setKind("success");
      }
      await refresh(agentId);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setResult(`${submit ? "Transaction reverted" : "eth_call simulation reverted"}: ${message.slice(0, 320)}`);
      setKind(submit ? "error" : "simulation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="GUARDED DEFI DEMO"
        title="Prove the capability at the module"
        description="The agent session key is generated in your browser and never persisted. The vault checks the mirrored epoch, target, selector, cap and expiry on every call. Testnet-only asset."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <Overline>AGENT EXECUTION</Overline>
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="mb-1 block text-[16px] text-ink-2">Policy (agentId)</span>
              <select
                value={agentId}
                onChange={(e) => { setAgentId(e.target.value); void refresh(e.target.value); }}
                className="w-full rounded-sm border border-line-input bg-surface-2 px-3 py-2 text-[17px] text-ink"
              >
                {events.length === 0 && <option value="">No policies observed</option>}
                {events.map((e) => <option key={e.agentId} value={e.agentId}>Epoch {e.epoch} · {e.active ? "ACTIVE" : "REVOKED"} · {truncateHex(e.agentId, 8, 6)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[16px] text-ink-2">Ephemeral agent private key (test only)</span>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="0x…"
                className="mono w-full rounded-sm border border-line-input bg-surface-2 px-3 py-2 text-[16px] text-ink outline-none focus:border-cyan"
              />
              <span className="mt-1 block text-[15px] text-ink-3">Generated locally; never sent to a server.</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-[16px] text-ink-2">Amount (test units)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="w-full rounded-sm border border-line-input bg-surface-2 px-3 py-2 text-[17px] text-ink outline-none focus:border-cyan" />
            </label>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => void run(false)} disabled={busy} className="rounded-sm border border-cyan/60 bg-tint-active px-3 py-2 text-[16px] font-bold uppercase text-cyan hover:bg-cyan/10 disabled:opacity-45">
                Simulate action (eth_call)
              </button>
              <button onClick={() => void run(true)} disabled={busy} className="rounded-sm border border-cyan bg-cyan px-3 py-2 text-[16px] font-bold uppercase text-inverse hover:bg-cyan/85 disabled:opacity-45">
                Submit action on Unichain
              </button>
            </div>
            {result && (
              <div className={`rounded-sm border p-3 text-[16px] ${kind === "success" ? "border-cyan/60 bg-tint-active text-cyan" : kind === "simulation" ? "border-amber/60 bg-tint-pending text-amber" : "border-vermilion/60 bg-tint-revoked text-vermilion"}`} role="status">
                {result.startsWith("Action confirmed") ? (
                  <ExplorerLink href={txUrl("unichain", result.split(" ").pop() ?? "")}>{truncateHex(result.split(" ").pop() ?? "", 12, 8)} ↗</ExplorerLink>
                ) : result}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <Overline>MIRRORED STATE</Overline>
            <div className="mt-4 space-y-3 text-[17px]">
              <div className="flex justify-between"><span className="text-ink-3">Destination status</span><StatusChip status={status} /></div>
              <div className="flex justify-between"><span className="text-ink-3">Mirror epoch</span><Mono>{epoch ?? "UNKNOWN"}</Mono></div>
              <div className="flex justify-between"><span className="text-ink-3">Idle test units</span><Mono>{positions ? positions.idle.toString() : "UNKNOWN"}</Mono></div>
              <div className="flex justify-between"><span className="text-ink-3">Strategy bucket</span><Mono>{positions ? positions.strategy.toString() : "UNKNOWN"}</Mono></div>
            </div>
          </Card>
          <Card>
            <Overline>WHAT PROVES THE REVOKE</Overline>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-[17px] leading-6 text-ink-2">
              <li>Run an action while the mirror is active — it succeeds on-chain.</li>
              <li>Revoke on Base from the Revoke screen and wait for the destination epoch to advance.</li>
              <li>Re-run the identical action — the module rejects it with an explicit policy error.</li>
            </ol>
          </Card>
        </div>
      </div>

      {events.length === 0 && <div className="mt-8"><EmptyState title="No policy to demonstrate" hint="Publish a policy on Base Sepolia first." /></div>}
    </>
  );
}
