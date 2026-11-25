import { readSourceEvents, readMirrorPolicy, readVaultEvents } from "@/lib/chain-data";
import { deriveStatus, STATUS } from "@/lib/status";
import { Card, EmptyState, ExplorerLink, Mono, Overline, PageHeader, StatusChip, truncateHex } from "@/components/ui";
import { RouteVisual } from "@/components/RouteVisual";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ agentId: string }> };

export default async function PolicyDetail({ params }: Params) {
  const { agentId } = await params;
  const id = agentId as `0x${string}`;
  const events = (await readSourceEvents()).filter((e) => e.agentId.toLowerCase() === id.toLowerCase());
  const mirror = await readMirrorPolicy(id);
  const actions = (await readVaultEvents()).filter((a) => a.agentId.toLowerCase() === id.toLowerCase());

  if (events.length === 0) {
    return (
      <>
        <PageHeader kicker="AGENT POLICY DETAIL" title="Policy not found on source" />
        <EmptyState title="No events for this agent ID" hint="The registry returned no PolicyUpdated events for this identifier." />
      </>
    );
  }

  const current = events.reduce((a, b) => (b.epoch > a.epoch ? b : a));
  const status = deriveStatus(current.active, mirror ? Number(mirror.epoch) : null, current.epoch);

  const field = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <span className="text-[13px] text-ink-3">{label}</span>
      <span className="text-right text-[13px] text-ink">{value}</span>
    </div>
  );

  return (
    <>
      <PageHeader kicker="AGENT POLICY DETAIL" title="Northstar Rebalance Agent" description={current.agentId} />
      <div className="mb-6"><StatusChip status={status} /></div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <Overline>CAPABILITY SCOPE</Overline>
          <div className="mt-3">
            {field("Agent key", <Mono>{current.agent}</Mono>)}
            {field("Destination chain", <Mono>{current.destinationChainId.toString()}</Mono>)}
            {field("Allowed module", <Mono>{current.destinationModule}</Mono>)}
            {field("Allowed selector", <Mono>{current.allowedSelector}</Mono>)}
            {field("Per-action cap", <Mono>{current.maxValue.toString()}</Mono>)}
            {field("Expiry", <Mono>{new Date(current.expiresAt * 1000).toISOString()}</Mono>)}
            {field("Epoch", <Mono>{current.epoch}</Mono>)}
            {field("Source active", <span className={current.active ? "text-cyan" : "text-vermilion"}>{current.active ? "TRUE" : "FALSE"}</span>)}
            {field("Policy hash", <Mono title={current.policyHash}>{truncateHex(current.policyHash, 14, 10)}</Mono>)}
            {field("Mirrored epoch", <Mono>{mirror ? Number(mirror.epoch) : "UNKNOWN"}</Mono>)}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <Overline>REAL TRANSACTION PATH</Overline>
            <div className="mt-5">
              <RouteVisual
                status={status}
                stages={[
                  {
                    label: "Base Sepolia",
                    sub: "origin event",
                    hash: current.txHash,
                    url: `https://sepolia.basescan.org/tx/${current.txHash}`,
                    state: "complete",
                  },
                  { label: "Reactive Omni", sub: "react() on Lasna", state: mirror ? "complete" : "pending" },
                  { label: "Unichain Sepolia", sub: "callback receipt", state: mirror ? "complete" : "pending" },
                ]}
              />
            </div>
          </Card>
          <Card>
            <Overline>EVENT HISTORY</Overline>
            <ol className="mt-4 space-y-3">
              {events
                .slice()
                .reverse()
                .map((e) => (
                  <li key={e.txHash} className="flex items-start justify-between gap-3 border-l border-line pl-4">
                    <div>
                      <p className="text-[13px] text-ink">Epoch {e.epoch} · {e.active ? "GRANT" : "REVOKE"}</p>
                      <ExplorerLink href={`https://sepolia.basescan.org/tx/${e.txHash}`}>{truncateHex(e.txHash, 10, 8)}</ExplorerLink>
                    </div>
                    <span className="mono text-[11px] text-ink-3">#{e.blockNumber.toString()}</span>
                  </li>
                ))}
            </ol>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <Overline>GUARDED ACTIONS</Overline>
        {actions.length === 0 ? (
          <div className="card mt-4 p-6 text-[13px] text-ink-3">
            {status === STATUS.DESTINATION_REVOKED || status === STATUS.SOURCE_REVOKED
              ? "No successful guarded actions were observed. Any post-revoke attempt is expected to revert on-chain."
              : "No guarded actions observed yet."}
          </div>
        ) : (
          <div className="card mt-4 overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-ink-3">
                <tr><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Epoch</th><th className="px-4 py-3">Transaction</th></tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.txHash} className="border-t border-line">
                    <td className="px-4 py-3 tabular">{a.amount.toString()}</td>
                    <td className="px-4 py-3 tabular">{a.epoch}</td>
                    <td className="px-4 py-3"><ExplorerLink href={`https://sepolia.uniscan.xyz/tx/${a.txHash}`}>{truncateHex(a.txHash, 10, 8)}</ExplorerLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
