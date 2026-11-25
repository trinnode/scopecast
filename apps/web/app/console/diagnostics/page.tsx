import { readDiagnostics } from "@/lib/chain-data";
import { addresses, CALLBACK_PROXY, SYSTEM_CONTRACT, POLICY_UPDATED_TOPIC, rpcUrls } from "@/lib/config";
import { Card, Mono, Overline, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Diagnostics() {
  const checks = await readDiagnostics();
  const rows = [
    ["PolicyHub (Base)", addresses.policyHub],
    ["ScopeCastReactive (Lasna)", addresses.reactive],
    ["PolicyMirror (Unichain)", addresses.policyMirror],
    ["GuardedDeFiVault (Unichain)", addresses.guardedVault],
    ["MockAsset (Unichain)", addresses.token],
  ] as const;

  return (
    <>
      <PageHeader
        kicker="CONFIGURE · DIAGNOSTICS"
        title="Chain and callback health"
        description="Live RPC checks and configured addresses. A failed check is shown as unavailable — the console never infers success from a callback request alone."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <Overline>LIVE CHECKS</Overline>
          <div className="mt-4 space-y-2">
            {checks.map((c) => (
              <div key={c.name} className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-b-0">
                <div>
                  <p className="text-[17px] text-ink">{c.name}</p>
                  {c.detail && <p className="text-[15px] text-ink-3">{c.detail}</p>}
                </div>
                <span className={`mono text-[16px] ${c.ok ? "text-cyan" : "text-vermilion"}`}>
                  {c.ok ? "▶ " : "! "}{c.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <Overline>CONFIGURED ADDRESSES</Overline>
            <div className="mt-4 space-y-3">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-[16px]">
                  <span className="text-ink-3">{label}</span>
                  <Mono>{value ?? "NOT CONFIGURED"}</Mono>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Overline>SYSTEM CONSTANTS</Overline>
            <div className="mt-4 space-y-3 text-[16px]">
              <div><span className="text-ink-3">Lasna system contract</span><div><Mono>{SYSTEM_CONTRACT}</Mono></div></div>
              <div><span className="text-ink-3">Base callback proxy</span><div><Mono>{CALLBACK_PROXY.base}</Mono></div></div>
              <div><span className="text-ink-3">Unichain callback proxy</span><div><Mono>{CALLBACK_PROXY.unichain}</Mono></div></div>
              <div><span className="text-ink-3">PolicyUpdated topic0</span><div><Mono>{POLICY_UPDATED_TOPIC}</Mono></div></div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-8">
        <Overline>RPC ENDPOINTS IN USE</Overline>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Object.entries(rpcUrls).map(([k, v]) => (
            <div key={k} className="rounded-sm border border-line bg-surface-2 p-3">
              <p className="text-[15px] uppercase tracking-[0.08em] text-ink-3">{k}</p>
              <Mono>{v}</Mono>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
