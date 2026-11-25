import Link from "next/link";
import { readSourceEvents, readMirrorPolicy } from "@/lib/chain-data";
import { deriveStatus } from "@/lib/status";
import { Card, EmptyState, Mono, Overline, PageHeader, StatusChip, truncateHex } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Policies() {
  const events = await readSourceEvents();
  const latest = new Map<string, (typeof events)[number]>();
  for (const e of events) {
    const prev = latest.get(e.agentId);
    if (!prev || e.epoch > prev.epoch) latest.set(e.agentId, e);
  }
  const rows = await Promise.all([...latest.values()].map(async (e) => ({ e, m: await readMirrorPolicy(e.agentId) })));

  return (
    <>
      <PageHeader
        kicker="GOVERN · AGENT POLICIES"
        title="Agent capability registry"
        description="The latest epoch per agent. Source state comes from PolicyUpdated logs; destination state comes from the mirrored contract on Unichain Sepolia."
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/console/create" className="rounded-sm border border-cyan/60 bg-tint-active px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-cyan hover:bg-cyan/10">
          + New policy
        </Link>
        <Link href="/console/revoke" className="rounded-sm border border-vermilion/60 bg-tint-revoked px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-vermilion hover:bg-vermilion/10">
          Revoke across chains
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No policies on source" hint="Publish a policy from Base Sepolia to populate this table." />
      ) : (
        <div className="grid gap-4">
          {rows.map(({ e, m }) => {
            const status = deriveStatus(e.active, m ? Number(m.epoch) : null, e.epoch);
            return (
              <Link key={e.agentId} href={`/console/policies/${e.agentId}`} className="block cursor-pointer">
                <Card rail={status.includes("REVOKED") ? "revoked" : status.includes("PENDING") ? "pending" : "active"} className="transition-colors duration-200 hover:bg-elevated">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-[16px] font-semibold text-ink">Northstar Rebalance Agent</span>
                        <StatusChip status={status} />
                      </div>
                      <p className="mono mt-2 text-[12px] text-ink-3">{e.agentId}</p>
                    </div>
                    <div className="text-right text-[12px] text-ink-2">
                      <p>epoch <span className="mono text-ink">{e.epoch}</span> · mirror <span className="mono text-ink">{m ? Number(m.epoch) : "unknown"}</span></p>
                      <p className="mt-1">cap <span className="mono text-ink">{e.maxValue.toString()}</span> · expires {new Date(e.expiresAt * 1000).toISOString().slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-line pt-4 text-[12px] sm:grid-cols-3">
                    <div><span className="text-ink-3">Agent key </span><Mono>{truncateHex(e.agent)}</Mono></div>
                    <div><span className="text-ink-3">Target </span><Mono>{truncateHex(e.destinationModule)}</Mono></div>
                    <div><span className="text-ink-3">Selector </span><Mono>{e.allowedSelector}</Mono></div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <div className="mt-6"><Overline>TIP</Overline><p className="mt-1 text-[13px] text-ink-3">Select a policy to see its full lifecycle and the three real transaction stages.</p></div>
    </>
  );
}
