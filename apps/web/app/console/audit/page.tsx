import { readSourceEvents, readVaultEvents } from "@/lib/chain-data";
import { addresses } from "@/lib/config";
import { Card, EmptyState, ExplorerLink, Mono, Overline, PageHeader, StatusChip } from "@/components/ui";
import { truncateHex } from "@/lib/format";
import { deriveStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function Audit() {
  const events = await readSourceEvents();
  const actions = await readVaultEvents();

  return (
    <>
      <PageHeader
        kicker="AUDIT EXPLORER"
        title="Event trail across chains"
        description="Filterable by agent ID, epoch and state. Every row links to the official explorer for the chain that produced it."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><Overline>SOURCE EVENTS</Overline><p className="mt-2 font-display text-[26px]">{events.length}</p></Card>
        <Card className="p-4"><Overline>GUARDED ACTIONS</Overline><p className="mt-2 font-display text-[26px]">{actions.length}</p></Card>
        <Card className="p-4"><Overline>REGISTRY</Overline><p className="mono mt-2 text-[15px] text-ink-2">{addresses.policyHub ?? "NOT CONFIGURED"}</p></Card>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No source events" hint="Configure PolicyHub and publish a policy to populate the audit trail." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[17px]">
              <thead className="bg-surface-2 text-[15px] uppercase tracking-[0.08em] text-ink-3">
                <tr>
                  <th className="px-4 py-3">Agent ID</th>
                  <th className="px-4 py-3">Epoch</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Cap</th>
                  <th className="px-4 py-3">Policy hash</th>
                  <th className="px-4 py-3">Source tx</th>
                </tr>
              </thead>
              <tbody>
                {events.slice().reverse().map((e) => (
                  <tr key={e.txHash} className="border-t border-line hover:bg-elevated">
                    <td className="px-4 py-3"><Mono title={e.agentId}>{truncateHex(e.agentId, 10, 6)}</Mono></td>
                    <td className="px-4 py-3 tabular">{e.epoch}</td>
                    <td className="px-4 py-3"><StatusChip status={e.active ? "SOURCE_POLICY_ACTIVE" : "SOURCE_REVOKED"} /></td>
                    <td className="px-4 py-3 tabular">{e.maxValue.toString()}</td>
                    <td className="px-4 py-3"><Mono title={e.policyHash}>{truncateHex(e.policyHash, 8, 6)}</Mono></td>
                    <td className="px-4 py-3"><ExplorerLink href={`https://sepolia.basescan.org/tx/${e.txHash}`}>{truncateHex(e.txHash, 8, 6)}</ExplorerLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Overline>DESTINATION ACTIONS</Overline>
        {actions.length === 0 ? (
          <p className="mt-3 text-[17px] text-ink-3">No successful guarded actions observed.</p>
        ) : (
          <div className="card mt-4 overflow-hidden">
            <table className="w-full text-left text-[17px]">
              <thead className="bg-surface-2 text-[15px] uppercase tracking-[0.08em] text-ink-3">
                <tr><th className="px-4 py-3">Agent</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Epoch</th><th className="px-4 py-3">Tx</th></tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.txHash} className="border-t border-line">
                    <td className="px-4 py-3"><Mono>{truncateHex(a.agentId, 10, 6)}</Mono></td>
                    <td className="px-4 py-3 tabular">{a.amount.toString()}</td>
                    <td className="px-4 py-3 tabular">{a.epoch}</td>
                    <td className="px-4 py-3"><ExplorerLink href={`https://sepolia.uniscan.xyz/tx/${a.txHash}`}>{truncateHex(a.txHash, 8, 6)}</ExplorerLink></td>
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
