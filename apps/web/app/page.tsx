import Link from "next/link";
import { ArrowUpRight, LockKeyhole, RadioTower, ShieldCheck, Layers3, Activity, Ban, Eye } from "lucide-react";
import { RouteVisual } from "@/components/RouteVisual";
import { Overline } from "@/components/ui";
import { BackgroundMotion, Beams, GradientText, RevealText, ScrollProgress, ScrollReveal, SpotlightCard, TiltCard } from "@/components/effects";
import { BrandWordmark } from "@/components/Brand";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <ScrollProgress />
      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        <BrandWordmark width={180} className="text-ink" />
        <nav className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3" aria-label="Main navigation">
          <a href="#mechanism" className="hidden hover:text-flare sm:inline">Mechanism</a>
          <a href="#scope" className="hidden hover:text-flare sm:inline">Scope</a>
          <Link href="/console" className="flex items-center gap-2 border border-flare px-4 py-2.5 text-flare transition-colors hover:bg-flare hover:text-canvas">
            Open console <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main>
        <section className="noise relative overflow-hidden border-y border-line">
          <BackgroundMotion />
          <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-8 md:py-28">
            <div>
              <Overline>REACTIVE OMNI BUILDATHON · EVERY SECOND COUNTS</Overline>
              <h1 className="mt-6 text-[38px] leading-[1.02] sm:text-[52px] lg:text-[64px]">
                REVOKE ONCE.
                <br />
                <GradientText>ENFORCE EVERYWHERE.</GradientText>
              </h1>
              <div className="mt-7 max-w-[54ch] text-[15px] leading-7 text-ink-2">
                <RevealText text="One versioned capability policy. One Reactive event. One authenticated callback. A destination contract that refuses the next agent action when the newer epoch lands." />
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/console" className="moving-border flex items-center gap-2 border border-flare px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-flare">
                  Open the console <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
                <a href="#mechanism" className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 underline decoration-line-strong underline-offset-8 hover:text-flare">See the callback path</a>
              </div>
              <p className="mt-10 max-w-[58ch] border-l-2 border-amber pl-4 font-mono text-[11px] leading-5 text-ink-3">
                Honest by design: revocation is asynchronous. Settled transactions are not reversed.
                Only modules that query the mirror are protected.
              </p>
            </div>

            <TiltCard className="relative">
              <SpotlightCard className="border border-line-strong bg-[#08080A]/85 p-5 backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <Overline>PROPAGATION ROUTE · EXAMPLE</Overline>
                  <span className="border border-amber/60 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber">SIMULATION</span>
                </div>
                <div className="tilt-inner">
                  <RouteVisual
                    status="DESTINATION_POLICY_ACTIVE"
                    simulation
                    stages={[
                      { label: "BASE SEPOLIA", sub: "PolicyHub · 84532", state: "complete" },
                      { label: "REACTIVE OMNI", sub: "react() · Lasna", state: "complete" },
                      { label: "UNICHAIN", sub: "PolicyMirror · 1301", state: "complete" },
                    ]}
                  />
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
                  <span>epoch 01 → 02</span>
                  <span className="text-flare">policy hash verified</span>
                </div>
              </SpotlightCard>
            </TiltCard>
          </div>
        </section>

        <ScrollReveal>
        <section id="mechanism" className="relative mx-auto max-w-7xl px-4 py-20 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Overline>THE MECHANISM</Overline>
              <h2 className="mt-4 text-[26px] md:text-[34px]">THREE STAGES. ONE POLICY.</h2>
            </div>
            <p className="max-w-[46ch] text-[13px] leading-6 text-ink-3">
              The capability is authored on one chain and enforced on another. Every stage is verifiable by transaction hash.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {[
              { icon: LockKeyhole, n: "01", title: "SOURCE POLICY", body: "Agent key, target, selector, cap, expiry, epoch and hash written by the owner on Base Sepolia.", span: "md:col-span-2" },
              { icon: RadioTower, n: "02", title: "REACTIVE EVENT", body: "Subscription validates chain, emitter, topic0, topic count and canonical policy hash before requesting a callback.", span: "" },
              { icon: ShieldCheck, n: "03", title: "DESTINATION GUARD", body: "A strictly newer epoch is applied by the callback; the vault checks it on every agent call.", span: "" },
              { icon: Layers3, n: "04", title: "ORDERED STATE", body: "A late callback at an older epoch cannot reactivate a revoked capability. Delivery is idempotent.", span: "md:col-span-2" },
              { icon: Activity, n: "05", title: "VERIFIABLE TRAIL", body: "Source, Reactive and destination receipts are shown with real hashes and measured propagation time.", span: "md:col-span-2" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <SpotlightCard key={item.n} className={`${item.span} border border-line bg-surface p-6 transition-colors duration-200 hover:border-line-strong`}>
                  <div className="flex items-center justify-between">
                    <Icon size={20} strokeWidth={1.5} className="text-flare" aria-hidden="true" />
                    <span className="mono text-[10px] text-ink-3">{item.n}</span>
                  </div>
                  <h3 className="mt-6 text-[14px]">{item.title}</h3>
                  <p className="mt-3 max-w-[52ch] text-[13px] leading-6 text-ink-2">{item.body}</p>
                </SpotlightCard>
              );
            })}
          </div>
        </section>

        </ScrollReveal>
        <ScrollReveal>
        <section className="relative overflow-hidden border-y border-line bg-[#08080A]">
          <Beams />
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:px-8">
            <Overline>STATE TRANSITIONS</Overline>
            <h2 className="mt-4 text-[26px] md:text-[34px]">GRANT → ACT → REVOKE → DENY</h2>
            <div className="mt-12 grid gap-0 md:grid-cols-4">
              {[
                { label: "SOURCE GRANT", detail: "PolicyUpdated on Base", tone: "text-flare" },
                { label: "DESTINATION ACTIVE", detail: "Callback confirmed on Unichain", tone: "text-flare" },
                { label: "SOURCE REVOKED", detail: "Propagation pending", tone: "text-amber" },
                { label: "ACTION DENIED", detail: "Guard rejects with explicit error", tone: "text-blush" },
              ].map((step, i) => (
                <div key={step.label} className="relative border-l border-line px-5 py-4">
                  <span className={`mono text-[10px] ${step.tone}`}>0{i + 1}</span>
                  <p className="mt-3 text-[13px]">{step.label}</p>
                  <p className="mt-2 text-[12px] text-ink-3">{step.detail}</p>
                  <span className="absolute -left-[3px] top-5 h-[5px] w-[5px] bg-white" />
                </div>
              ))}
            </div>
          </div>
        </section>

        </ScrollReveal>
        <ScrollReveal>
        <section id="scope" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Overline>WHAT THIS IS NOT</Overline>
              <h2 className="mt-4 text-[26px] leading-tight md:text-[32px]">A COORDINATION LAYER, NOT MAGIC.</h2>
              <p className="mt-5 max-w-[48ch] text-[14px] leading-7 text-ink-2">
                SCOPECAST synchronises capability state for modules that integrate its guard. It is not a wallet,
                an approval scanner, a price-driven circuit breaker or a universal revoker.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { icon: Ban, text: "No retroactive reversal of settled transactions" },
                { icon: Eye, text: "Propagation window is visible, never hidden" },
                { icon: ShieldCheck, text: "Only integrated modules query the mirror" },
                { icon: LockKeyhole, text: "Source owner must be a multisig in production" },
                { icon: Activity, text: "Callback gas reserve must stay funded" },
                { icon: RadioTower, text: "Testnet parameters are re-verified before deploy" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-start gap-3 border border-line bg-surface px-4 py-4 text-[12px] leading-5 text-ink-2">
                    <Icon size={15} className="mt-0.5 shrink-0 text-ink-3" aria-hidden="true" />
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        </ScrollReveal>
        <ScrollReveal>
        <section className="border-t border-line bg-[#08080A]">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8">
            <p className="font-display text-[20px] leading-snug md:text-[28px]">READY TO INSPECT THE REAL FLOW?</p>
            <Link href="/console/architecture" className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-flare underline underline-offset-8">Read the architecture →</Link>
          </div>
        </section>
        </ScrollReveal>
      </main>
    </div>
  );
}
