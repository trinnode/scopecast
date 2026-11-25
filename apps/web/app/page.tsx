import Link from "next/link";
import { ArrowRight, CornerDownRight, LockKeyhole, RadioTower, ShieldCheck } from "lucide-react";
import { RouteVisual } from "@/components/RouteVisual";
import { Overline } from "@/components/ui";

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/scopecast-lockup.svg" alt="SCOPECAST" className="h-8 w-auto text-ink" />
        </div>
        <nav className="flex items-center gap-4 text-[13px] text-ink-2" aria-label="Main navigation">
          <a href="#how" className="hidden hover:text-cyan sm:inline">How it works</a>
          <a href="#scope" className="hidden hover:text-cyan sm:inline">Scope</a>
          <Link href="/console" className="rounded-sm border border-cyan/60 bg-tint-active px-3 py-2 font-bold uppercase tracking-[0.06em] text-cyan hover:bg-cyan/10">
            Open console
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden border-y border-line bg-surface">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-6 md:py-24">
            <div>
              <Overline>REACTIVE OMNI BUILDATHON · EVERY SECOND COUNTS</Overline>
              <h1 className="mt-4 font-display text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-ink md:text-[56px]">
                Revoke once.
                <br />
                <span className="text-cyan">Enforce everywhere.</span>
              </h1>
              <p className="mt-6 max-w-[54ch] text-[16px] leading-7 text-ink-2">
                SCOPECAST gives a protocol one authoritative policy for a delegated DeFi agent. A Reactive
                contract mirrors every versioned change to integrated execution modules on another chain —
                and the module refuses the next action once the newer epoch arrives.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/console"
                  className="inline-flex items-center gap-2 rounded-sm border border-cyan bg-cyan px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-inverse hover:bg-cyan/85"
                >
                  Open the console <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a href="#how" className="text-[13px] text-ink-2 underline decoration-line-input underline-offset-4 hover:text-cyan">
                  See the callback path
                </a>
              </div>
              <p className="mt-8 max-w-[60ch] text-[12px] leading-5 text-ink-3">
                Honest by design: revocation is asynchronous. A transaction already settled on the destination
                is not reversed. Only modules that query the mirror are protected.
              </p>
            </div>
            <div className="rounded-lg border border-line-strong bg-surface-2 p-5 shadow-[0_12px_32px_rgba(0,0,0,.35)]">
              <div className="mb-4 flex items-center justify-between">
                <Overline>LIVE ROUTE · EXAMPLE POLICY</Overline>
                <span className="rounded-xs border border-amber/60 bg-tint-pending px-2 py-1 text-[10px] font-bold text-amber">SIMULATION</span>
              </div>
              <RouteVisual
                status="DESTINATION_POLICY_ACTIVE"
                simulation
                stages={[
                  { label: "Base Sepolia", sub: "PolicyHub · origin event", state: "complete" },
                  { label: "Reactive Omni", sub: "react() · decode + validate", state: "complete" },
                  { label: "Unichain Sepolia", sub: "PolicyMirror · enforcement", state: "complete" },
                ]}
              />
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <Overline>THE SECURITY PROPERTY</Overline>
          <h2 className="mt-3 font-display text-[28px] font-bold tracking-[-0.02em]">One policy, three verifiable stages</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: LockKeyhole,
                title: "Versioned source policy",
                body: "Agent key, target module, method selector, value cap, expiry and epoch are written to a single registry. Every change increments the epoch.",
              },
              {
                icon: RadioTower,
                title: "Authenticated reaction",
                body: "A Reactive contract validates origin chain, registry address, event signature and payload hash before requesting a callback. Stale epochs never win.",
              },
              {
                icon: ShieldCheck,
                title: "Enforced at the module",
                body: "A guarded vault checks the mirrored policy on every agent call. After the revoke callback lands, the exact same call is rejected on-chain.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="card-flat p-6">
                  <Icon size={22} strokeWidth={1.5} className="text-cyan" aria-hidden="true" />
                  <h3 className="mt-5 font-display text-[17px] font-semibold">{item.title}</h3>
                  <p className="mt-3 text-[13px] leading-6 text-ink-2">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="scope" className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-[0.8fr_1.2fr] md:px-6">
            <div>
              <Overline>WHAT THIS IS — AND IS NOT</Overline>
              <h2 className="mt-3 font-display text-[26px] font-bold">A coordination layer, not magic</h2>
              <p className="mt-4 text-[14px] leading-7 text-ink-2">
                SCOPECAST synchronises capability state for modules that integrate its guard. It is not a
                smart wallet, an approval scanner, a price-driven circuit breaker or a universal revoker.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "No retroactive reversal of settled transactions",
                "Propagation window between source and destination",
                "Only integrated modules query the mirror",
                "Source owner must be a multisig in production",
                "Callback gas reserve must stay funded",
                "Testnet chain parameters can change",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 rounded-sm border border-line bg-surface-2 px-4 py-3 text-[13px] text-ink-2">
                  <CornerDownRight size={15} className="mt-0.5 shrink-0 text-fog" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 text-center md:px-6">
          <p className="font-display text-[22px] text-ink">Ready to inspect the real flow?</p>
          <Link href="/console/architecture" className="mt-5 inline-block text-[13px] text-cyan underline underline-offset-4">
            Read the architecture →
          </Link>
        </section>
      </main>
    </div>
  );
}
