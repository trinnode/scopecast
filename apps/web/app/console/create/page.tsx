"use client";

import { useState } from "react";
import { createPublicClient, http, keccak256, stringToHex, parseUnits, isAddress, toHex } from "viem";
import { useWallet } from "@/components/WalletProvider";
import { Card, Mono, Overline, PageHeader, StatusChip } from "@/components/ui";
import { policyHubAbi } from "@/lib/contracts";
import { addresses, baseSepolia, rpcUrls, txUrl } from "@/lib/config";

const DEFAULT_SIGNATURE = "rebalance(bytes32,uint256)";

function selectorOf(signature: string): `0x${string}` {
  return keccak256(stringToHex(signature)).slice(0, 10) as `0x${string}`;
}

export default function CreatePolicy() {
  const { address, chainId, client, connect, switchToBase } = useWallet();
  const [name, setName] = useState("Northstar Rebalance Agent");
  const [agent, setAgent] = useState("");
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);
  const [cap, setCap] = useState("10");
  const [hours, setHours] = useState("2");
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const agentId = keccak256(stringToHex(name));
  const capWei = (() => {
    try {
      return parseUnits(cap || "0", 18);
    } catch {
      return 0n;
    }
  })();
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + Math.max(1, Number(hours) || 0) * 3600);

  const valid = isAddress(agent) && capWei > 0n && Number(hours) > 0 && signature.length > 0;

  async function submit() {
    if (!valid || !address || !client || !addresses.policyHub) {
      setError("Connect a wallet to Base Sepolia and complete every field.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const tx = await client.writeContract({
        chain: baseSepolia,
        account: address,
        address: addresses.policyHub,
        abi: policyHubAbi,
        functionName: "createPolicy",
        args: [agentId, agent as `0x${string}`, selectorOf(signature), capWei, BigInt(expiresAt)],
      });
      setHash(tx);
      const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrls.base) });
      await publicClient.waitForTransactionReceipt({ hash: tx });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-sm border border-line-input bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-cyan";

  return (
    <>
      <PageHeader
        kicker="GOVERN · CREATE / UPDATE POLICY"
        title="Authorise a bounded agent capability"
        description="The owner signs on Base Sepolia. Review the exact scope before submitting — every field is included in the policy hash that the Reactive contract verifies."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <Overline>POLICY DRAFT</Overline>
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="mb-1 block text-[12px] text-ink-2">Stable agent name</span>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
              <span className="mt-1 block text-[11px] text-ink-3">Hashed into a stable agentId.</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] text-ink-2">Agent public key</span>
              <input className={input} placeholder="0x…" value={agent} onChange={(e) => setAgent(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] text-ink-2">Allowed function signature</span>
              <input className={`${input} mono`} value={signature} onChange={(e) => setSignature(e.target.value)} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[12px] text-ink-2">Per-action cap (test units)</span>
                <input className={input} inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] text-ink-2">Expiry (hours from now)</span>
                <input className={input} inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} />
              </label>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <Overline>PERMISSION SUMMARY</Overline>
            <div className="mt-4 space-y-3 text-[13px]">
              <div className="flex justify-between gap-4"><span className="text-ink-3">Status</span><StatusChip status="POLICY_DRAFT" /></div>
              <div className="flex justify-between gap-4"><span className="text-ink-3">agentId</span><Mono title={agentId}>{agentId.slice(0, 14)}…</Mono></div>
              <div className="flex justify-between gap-4"><span className="text-ink-3">Destination</span><Mono>1301 (Unichain)</Mono></div>
              <div className="flex justify-between gap-4"><span className="text-ink-3">Module</span><Mono>{addresses.guardedVault ?? "NOT CONFIGURED"}</Mono></div>
              <div className="flex justify-between gap-4"><span className="text-ink-3">Selector</span><Mono>{selectorOf(signature)}</Mono></div>
              <div className="flex justify-between gap-4"><span className="text-ink-3">Max value</span><Mono>{capWei.toString()}</Mono></div>
              <div className="flex justify-between gap-4"><span className="text-ink-3">Expires</span><Mono>{new Date(Number(expiresAt) * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC</Mono></div>
              <div className="flex justify-between gap-4"><span className="text-ink-3">Epoch</span><Mono>1 (new agent)</Mono></div>
            </div>
          </Card>

          <Card>
            <Overline>OWNER SIGNATURE</Overline>
            <div className="mt-4 space-y-3">
              {!address && (
                <button onClick={() => void connect()} className="w-full rounded-sm border border-cyan/60 bg-tint-active px-3 py-2 text-[12px] font-bold uppercase text-cyan hover:bg-cyan/10">
                  Connect wallet
                </button>
              )}
              {address && chainId !== 84532 && (
                <button onClick={() => void switchToBase()} className="w-full rounded-sm border border-amber/60 bg-tint-pending px-3 py-2 text-[12px] font-bold uppercase text-amber hover:bg-amber/10">
                  Switch to Base Sepolia
                </button>
              )}
              <button
                onClick={() => void submit()}
                disabled={!valid || !address || chainId !== 84532 || busy || !addresses.policyHub}
                className="w-full rounded-sm border border-cyan bg-cyan px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-inverse hover:bg-cyan/85 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy ? "Awaiting confirmation…" : "Publish policy on Base"}
              </button>
              {!addresses.policyHub && <p className="text-[12px] text-amber">PolicyHub address is not configured — signing is disabled.</p>}
              {error && <p className="text-[12px] text-vermilion" role="alert">! {error}</p>}
              {hash && (
                <div className="rounded-sm border border-line bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-cyan">SOURCE TX SUBMITTED</p>
                  <a className="mono mt-1 block break-all text-[11px] text-ink-2 hover:underline" href={txUrl("base", hash)} target="_blank" rel="noreferrer">
                    {hash} ↗
                  </a>
                  <p className="mt-2 text-[11px] text-ink-3">Destination state only changes after the Reactive callback is confirmed.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
