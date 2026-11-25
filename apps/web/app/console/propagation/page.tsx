import { readSourceEvents } from "@/lib/chain-data";
import { readEvidence } from "@/lib/evidence";
import { Card, EmptyState, ExplorerLink, Mono, Overline, PageHeader, StatusChip } from "@/components/ui";
import { truncateHex } from "@/lib/format";
import { RouteVisual } from "@/components/RouteVisual";

export const dynamic = "force-dynamic";

export default async function Propagation() {
  const events = await readSourceEvents();
  const evidence = readEvidence();
  const latest = events.length ? events.reduce((a, b) => (b.epoch > a.epoch ? b : a)) : null;

  const stages = [
    {
      key: "SOURCE_POLICY_ACTIVE",
      title: "Source policy event",
      chain: "Base Sepolia · 84532",
      hash: evidence.grant?.source ?? latest?.txHash,
      explorer: "base",
    },
    {
      key: "REACTIVE_EVENT_PROCESSED",
      title: "Reactive transaction",
      chain: "Reactive Omni / Lasna · 5318007",
      hash: evidence.grant?.reactive,
      explorer: "lasna",
    },
    {
      key: "CALLBACK_REQUESTED",
      title: "Destination callback receipt",
      chain: "Unichain Sepolia · 1301",
      hash: evidence.grant?.callback,
      explorer: "unichain",
    },
  ];

  return (
    <>
      <PageHeader
        kicker="LIVE PROPAGATION TIMELINE"
        title="From source confirmation to destination enforcement"
        description="Each stage is shown with the actual transaction hash only when it has been independently verified against the chain RPC. An unobserved stage stays UNKNOWN."
      />

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Overline>GRANT PATH</Overline>
          <StatusChip status={evidence.verified ? "DESTINATION_POLICY_ACTIVE" : "DESTINATION_SYNC_UNKNOWN"} />
        </div>
        <RouteVisual
          status={evidence.verified ? "DESTINATION_POLICY_ACTIVE" : "DESTINATION_SYNC_UNKNOWN"}
          simulation={!evidence.verified}
          stages={stages.map((s) => ({
            label: s.title,
            sub: s.chain,
            hash: s.hash,
            url: s.hash ? `https://${s.explorer === "base" ? "sepolia.basescan.org" : s.explorer === "lasna" ? "lasna.reactscan.net" : "sepolia.uniscan.xyz"}/tx/${s.hash}` : undefined,
            state: s.hash ? "complete" : "pending",
          }))}
        />
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <Overline>STAGE DETAIL</Overline>
          <ol className="mt-4 space-y-4">
            {stages.map((s, i) => (
              <li key={s.key} className="border-l border-line pl-4">
                <p className="text-[15px] uppercase tracking-[0.08em] text-cyan">0{i + 1} · {s.key}</p>
                <p className="mt-1 text-[18px] text-ink">{s.title}</p>
                <p className="text-[16px] text-ink-3">{s.chain}</p>
                <div className="mt-2">
                  {s.hash ? (
                    <ExplorerLink href={s.hash.startsWith("0x") ? `https://${s.explorer === "base" ? "sepolia.basescan.org" : s.explorer === "lasna" ? "lasna.reactscan.net" : "sepolia.uniscan.xyz"}/tx/${s.hash}` : "#"}>
                      {truncateHex(s.hash, 14, 10)}
                    </ExplorerLink>
                  ) : (
                    <span className="mono text-[15px] text-fog">NO VERIFIED RECEIPT</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <Overline>REVOCATION PATH</Overline>
          <ol className="mt-4 space-y-4">
            {[
              { label: "Source revoke transaction", hash: evidence.revoke?.source, explorer: "sepolia.basescan.org" },
              { label: "Reactive revoke transaction", hash: evidence.revoke?.reactive, explorer: "lasna.reactscan.net" },
              { label: "Destination revoke callback", hash: evidence.revoke?.callback, explorer: "sepolia.uniscan.xyz" },
              { label: "Post-revoke denial proof", hash: evidence.revoke?.denial, explorer: "sepolia.uniscan.xyz", kind: evidence.revoke?.denialKind },
            ].map((s, i) => (
              <li key={s.label} className="border-l border-line pl-4">
                <p className="text-[15px] uppercase tracking-[0.08em] text-vermilion">0{i + 1}</p>
                <p className="mt-1 text-[18px] text-ink">{s.label}</p>
                {s.hash ? (
                  <div className="mt-2">
                    <ExplorerLink href={`https://${s.explorer}/tx/${s.hash}`}>{truncateHex(s.hash, 14, 10)}</ExplorerLink>
                    {s.kind && <span className="ml-2 text-[15px] text-amber">({s.kind.toUpperCase()})</span>}
                  </div>
                ) : (
                  <p className="mono mt-2 text-[15px] text-fog">NO VERIFIED RECEIPT</p>
                )}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><Overline>OBSERVED PROPAGATION</Overline><p className="mt-2 font-display text-[26px] text-ink">{evidence.propagationMs ? `${evidence.propagationMs} ms` : "UNKNOWN"}</p></Card>
        <Card className="p-4"><Overline>MEASURED AT</Overline><p className="mono mt-2 text-[16px] text-ink">{evidence.measuredAt ?? "NOT RECORDED"}</p></Card>
        <Card className="p-4"><Overline>METHOD</Overline><p className="mt-2 text-[16px] text-ink-2">Destination block timestamp − source block timestamp, from verified receipts.</p></Card>
      </div>

      {!evidence.verified && (
        <div className="mt-8"><EmptyState title="Live flow not yet recorded" hint={evidence.note} /></div>
      )}
    </>
  );
}
