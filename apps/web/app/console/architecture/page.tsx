import Link from "next/link";
import { Card, Mono, Overline, PageHeader } from "@/components/ui";
import { POLICY_UPDATED_TOPIC, SYSTEM_CONTRACT, CALLBACK_PROXY } from "@/lib/config";

const flow = [
  {
    n: "01",
    title: "PolicyHub · Base Sepolia 84532",
    body: "Owner-only registry. create / update / revoke / rotate each increment a monotonic epoch and emit PolicyUpdated with all capability fields and a canonical policy hash. The agent cannot modify its own policy.",
  },
  {
    n: "02",
    title: "ScopeCastReactive · Reactive Omni 5318007",
    body: "Subscribed to the exact hub address and topic0. react() validates chain ID, emitter, topic count, event signature, destination chain/module and policy hash before requesting a callback. Irrelevant logs return without reverting.",
  },
  {
    n: "03",
    title: "PolicyMirror · Unichain Sepolia 1301",
    body: "Accepts callbacks only from the official callback proxy and the authorised reactive sender. Applies strictly newer epochs only. Idempotent under duplicate delivery; stale callbacks cannot reactivate a revoked policy.",
  },
  {
    n: "04",
    title: "GuardedDeFiVault · Unichain Sepolia 1301",
    body: "The only agent entry point reads the mirror and checks active, agent, chain, target, selector, expiry and cap. Successful actions move test tokens between two internal positions and emit an auditable event.",
  },
];

export default function Architecture() {
  return (
    <>
      <PageHeader
        kicker="CONFIGURE · ARCHITECTURE"
        title="Three chains, one versioned capability"
        description="SCOPECAST is a coordination layer for integrated contracts. It is not a smart wallet, approval scanner, universal revoker or price-driven circuit breaker."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {flow.map((step) => (
          <Card key={step.n}>
            <Overline>{step.n}</Overline>
            <h2 className="mt-3 font-display text-[18px] font-semibold text-ink">{step.title}</h2>
            <p className="mt-3 text-[13px] leading-6 text-ink-2">{step.body}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <Overline>TRUST BOUNDARIES</Overline>
          <ul className="mt-4 space-y-3 text-[13px] leading-6 text-ink-2">
            <li><strong className="text-ink">Trusted:</strong> source owner transaction (use a multisig in production).</li>
            <li><strong className="text-ink">Authenticated:</strong> reactive callback via proxy + sender identity.</li>
            <li><strong className="text-ink">Hostile:</strong> agent calldata, opaque event bytes, any unregistered module.</li>
            <li><strong className="text-ink">Asynchronous:</strong> the window between source finality and destination callback is real and visible.</li>
          </ul>
        </Card>
        <Card>
          <Overline>ORDERING INVARIANTS</Overline>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[13px] leading-6 text-ink-2">
            <li>Destination epoch never decreases.</li>
            <li>Callback at epoch n cannot modify state at epoch n or above.</li>
            <li>Inactive latest policy blocks every guarded action.</li>
            <li>Unrelated source events cannot modify the mirror.</li>
            <li>Policy hash binds all capability fields across chains.</li>
          </ol>
        </Card>
      </div>

      <Card className="mt-8">
        <Overline>CONSTANTS USED BY THE REACTIVE LAYER</Overline>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-[12px]">
          <div><span className="text-ink-3">topic0</span><div><Mono>{POLICY_UPDATED_TOPIC}</Mono></div></div>
          <div><span className="text-ink-3">system contract</span><div><Mono>{SYSTEM_CONTRACT}</Mono></div></div>
          <div><span className="text-ink-3">callback proxy (Unichain)</span><div><Mono>{CALLBACK_PROXY.unichain}</Mono></div></div>
        </div>
        <p className="mt-5 text-[12px] text-ink-3">Full documentation: <Link href="https://github.com/trinnode/scopecast" className="text-cyan hover:underline">repository ↗</Link></p>
      </Card>
    </>
  );
}
