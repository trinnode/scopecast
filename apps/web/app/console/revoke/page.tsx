"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { useWallet } from "@/components/WalletProvider";
import { Card, EmptyState, Mono, Overline, PageHeader, StatusChip } from "@/components/ui";
import { truncateHex } from "@/lib/format";
import { readSourceEvents, readMirrorPolicy, type SourceEvent } from "@/lib/chain-data";
import { deriveStatus, STATUS } from "@/lib/status";
import { policyHubAbi } from "@/lib/contracts";
import { addresses, baseSepolia, rpcUrls, txUrl } from "@/lib/config";

export default function Revoke() {
  const { address, chainId, client, connect, switchToBase } = useWallet();
  const [events, setEvents] = useState<SourceEvent[]>([]);
  const [selected, setSelected] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mirrorEpoch, setMirrorEpoch] = useState<number | null>(null);

  useEffect(() => {
    void readSourceEvents().then(({ events: list }) => {
      const latest = new Map<string, SourceEvent>();
      for (const e of list) if (!latest.has(e.agentId) || e.epoch > latest.get(e.agentId)!.epoch) latest.set(e.agentId, e);
      const rows = [...latest.values()];
      setEvents(rows);
      setSelected((prev) => prev || rows[0]?.agentId || "");
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    void readMirrorPolicy(selected as `0x${string}`).then((p) => setMirrorEpoch(p ? Number(p.epoch) : null));
  }, [selected]);

  // After submission, poll the destination mirror until the newer epoch lands.
  useEffect(() => {
    if (!selected || !hash) return;
    let cancelled = false;
    const poll = async () => {
      const policy = await readMirrorPolicy(selected as `0x${string}`);
      if (!cancelled && policy) setMirrorEpoch(Number(policy.epoch));
    };
    const interval = window.setInterval(() => void poll(), 4000);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 180_000);
    return () => { cancelled = true; window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [selected, hash]);

  const current = events.find((e) => e.agentId === selected);
  const status: ReturnType<typeof deriveStatus> = hash
    ? mirrorEpoch !== null && current && mirrorEpoch >= current.epoch + 1
      ? STATUS.DESTINATION_REVOKED
      : STATUS.SOURCE_REVOKED
    : current
      ? deriveStatus(current.active, mirrorEpoch, current.epoch)
      : STATUS.DESTINATION_SYNC_UNKNOWN;

  async function submit() {
    if (!address || !client || !current || !addresses.policyHub) return;
    setBusy(true);
    setError(null);
    try {
      const tx = await client.writeContract({
        chain: baseSepolia,
        account: address,
        address: addresses.policyHub,
        abi: policyHubAbi,
        functionName: "revokePolicy",
        args: [current.agentId],
      });
      setHash(tx);
      const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrls.base) });
      await publicClient.waitForTransactionReceipt({ hash: tx });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke transaction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="GOVERN · REVOKE"
        title="Revoke across chains"
        description="The source revocation is final on Base Sepolia. The destination mirror changes only after the authenticated callback is delivered and confirmed — the console never labels a source-only revoke as revoked everywhere."
      />

      {events.length === 0 ? (
        <EmptyState title="No policies available to revoke" hint="Publish a policy first. This console reads real source events; it will not fabricate a policy." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <Overline>SELECT POLICY</Overline>
            <div className="mt-4 space-y-2">
              {events.map((e) => (
                <button
                  key={e.agentId}
                  onClick={() => { setSelected(e.agentId); setHash(null); }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm border px-3 py-3 text-left transition-colors duration-200 ${
                    selected === e.agentId ? "border-cyan bg-tint-active" : "border-line bg-surface-2 hover:bg-elevated"
                  }`}
                >
                  <span>
                    <span className="block text-[17px] text-ink">Epoch {e.epoch} · {e.active ? "ACTIVE" : "REVOKED"}</span>
                    <Mono>{truncateHex(e.agentId, 14, 10)}</Mono>
                  </span>
                  <StatusChip status={deriveStatus(e.active, mirrorEpoch, e.epoch)} compact />
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card rail={status.includes("REVOKED") ? "revoked" : "pending"}>
              <Overline>CONSEQUENCE</Overline>
              <p className="mt-3 text-[17px] leading-6 text-ink-2">
                Revoking increments the epoch and sets the source policy inactive. The guarded vault will reject
                this agent&apos;s next call once the newer epoch reaches the mirror. A transaction already
                included on the destination before then is <strong className="text-ink">not</strong> reversed.
              </p>
              <div className="mt-5 space-y-3 text-[17px]">
                <div className="flex justify-between"><span className="text-ink-3">Source epoch</span><Mono>{current?.epoch ?? "—"}</Mono></div>
                <div className="flex justify-between"><span className="text-ink-3">Mirror epoch</span><Mono>{mirrorEpoch ?? "UNKNOWN"}</Mono></div>
                <div className="flex justify-between"><span className="text-ink-3">Current state</span><StatusChip status={status} /></div>
              </div>
              <div className="mt-6 space-y-3">
                {!address && <button onClick={() => void connect()} className="w-full rounded-sm border border-cyan/60 bg-tint-active px-3 py-2 text-[16px] font-bold uppercase text-cyan hover:bg-cyan/10">Connect owner wallet</button>}
                {address && chainId !== 84532 && <button onClick={() => void switchToBase()} className="w-full rounded-sm border border-amber/60 bg-tint-pending px-3 py-2 text-[16px] font-bold uppercase text-amber hover:bg-amber/10">Switch to Base Sepolia</button>}
                <button
                  onClick={() => void submit()}
                  disabled={!address || chainId !== 84532 || busy || !current?.active || !addresses.policyHub}
                  className="w-full rounded-sm border border-vermilion bg-vermilion px-3 py-2.5 text-[16px] font-bold uppercase tracking-[0.06em] text-inverse hover:bg-vermilion/85 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy ? "Awaiting confirmation…" : "Revoke across chains"}
                </button>
                {error && <p className="text-[16px] text-vermilion" role="alert">! {error}</p>}
                {hash && (
                  <div className="rounded-sm border border-line bg-surface-2 p-3">
                    <p className="text-[15px] uppercase tracking-[0.08em] text-amber">SOURCE_REVOKED · PROPAGATION PENDING</p>
                    <a className="mono mt-1 block break-all text-[15px] text-ink-2 hover:underline" href={txUrl("base", hash)} target="_blank" rel="noreferrer">{hash} ↗</a>
                    <p className="mt-2 text-[15px] text-ink-3">Waiting for the Reactive transaction and destination callback receipt before showing REVOKED ON DESTINATION.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
