import Link from "next/link";
import { readSourceEvents, readMirrorPolicy, readVaultPositions } from "@/lib/chain-data";
import { deriveStatus } from "@/lib/status";
import { Card, EmptyState, Mono, Overline, PageHeader, Stat, StatusChip, truncateHex } from "@/components/ui";
import { RouteVisual } from "@/components/RouteVisual";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const events = await readSourceEvents();
  const latestByAgent = new Map<string, (typeof events)[number]>();
  for (const e of events) {
    const prev = latestByAgent.get(e.agentId);
    if (!prev || e.epoch > prev.epoch) latestByAgent.set(e.agentId, e);
  }

  const rows = await Promise.all(
    [...latestByAgent.values()].map(async (e) => ({ event: e, mirror: await readMirrorPolicy(e.agentId) })),
  );
  const positions = await readVaultPositions();

  const active = rows.filter((r) => r.event.active).length;
  const revoked = rows.filter((r) => !r.event.active).length;
  const synced = rows.filter((r) => r.mirror && Number(r.mirror.epoch) === r.event.epoch).length;
  const pending = rows.length - synced;

  const sample = rows[0];
  const status = sample
    ? deriveStatus(sample.event.active, sample.mirror ? Number(sample.mirror.epoch) : null, sample.event.epoch)
    : "DESTINATION_SYNC_UNKNOWN";

  return (
    <>
      <PageHeader
        kicker="SECURITY OVERVIEW"
        title="Delegated authority, accounted for"
        description="State is read from Base Sepolia and Unichain Sepolia on every request. When a contract address is not configured, or an RPC is unreachable, the console shows UNKNOWN rather than guessing."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="AGENTS TRACKED" value={rows.length} tone="active" />
        <Stat label="ACTIVE POLICIES" value={active} tone="active" />
        <Stat label="PENDING MIRRORS" value={Math.max(pending, 0)} tone="pending" />
        <Stat label="REVOKED KEYS" value={revoked} tone="revoked" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <Overline>PROPAGATION ROUTE</Overline>
            <StatusChip status={status} />
          </div>
          <RouteVisual
            status={status}
            simulation={rows.length === 0}
            stages={[
              {
                label: "Base Sepolia",
                sub: "PolicyHub · 84532",
                hash: sample?.event.txHash,
                url: sample ? `https://sepolia.basescan.org/tx/${sample.event.txHash}` : undefined,
                state: sample ? "complete" : "pending",
              },
              { label: "Reactive Omni", sub: "Lasna · 5318007", state: sample?.mirror ? "complete" : "pending" },
              {
                label: "Unichain Sepolia",
                sub: "PolicyMirror · 1301",
                hash: sample?.mirror ? "mirrored epoch verified" : undefined,
                state: sample?.mirror ? "complete" : "pending",
              },
            ]}
          />
        </Card>

        <Card>
          <Overline>DESTINATION COVERAGE</Overline>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-[13px] text-ink-2">Guarded vault state</span>
              <span className="mono text-[12px] text-ink">{positions ? `${positions.idle.toString()} idle` : "UNKNOWN"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-[13px] text-ink-2">Mock strategy bucket</span>
              <span className="mono text-[12px] text-ink">{positions ? positions.strategy.toString() : "UNKNOWN"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-[13px] text-ink-2">Mirrors at source epoch</span>
              <span className="mono text-[12px] text-ink">{rows.length ? `${synced}/${rows.length}` : "UNKNOWN"}</span>
            </div>
            <Link href="/console/diagnostics" className="inline-flex items-center gap-2 text-[13px] text-cyan hover:underline">
              Inspect RPC and callback health →
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <Overline>RECENT POLICY STATE</Overline>
          <Link href="/console/policies" className="text-[12px] text-cyan hover:underline">View all →</Link>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title="No source policies observed yet"
            hint="No PolicyUpdated events were returned from the configured PolicyHub. Configure a deployed address and publish a policy on Base Sepolia, or use the local simulation to explore the console."
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-ink-3">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Epoch</th>
                  <th className="px-4 py-3">Cap</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r) => {
                  const s = deriveStatus(r.event.active, r.mirror ? Number(r.mirror.epoch) : null, r.event.epoch);
                  return (
                    <tr key={r.event.agentId} className="border-t border-line hover:bg-elevated">
                      <td className="px-4 py-3"><Mono>{truncateHex(r.event.agentId, 12, 8)}</Mono></td>
                      <td className="px-4 py-3 tabular">{r.event.epoch}</td>
                      <td className="px-4 py-3 tabular">{r.event.maxValue.toString()}</td>
                      <td className="px-4 py-3 tabular">{new Date(r.event.expiresAt * 1000).toISOString().slice(0, 16).replace("T", " ")}</td>
                      <td className="px-4 py-3"><StatusChip status={s} compact /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
