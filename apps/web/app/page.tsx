import Link from "next/link";
import { ArrowUpRight, Check, Minus, AlertTriangle } from "lucide-react";
import { RouteScene3D } from "@/components/RouteScene3D";
import { Overline } from "@/components/ui";
import { BackgroundMotion, Carousel, GradientText, RevealText, ScrollProgress, ScrollReveal, SpotlightCard, TiltCard } from "@/components/effects";
import { BrandMark, BrandWordmark } from "@/components/Brand";
import { ScrollAwareHeader } from "@/components/ScrollAwareHeader";
import { MobileMenu } from "@/components/MobileMenu";
import { readDeployments, readEvidence } from "@/lib/evidence";

const container = "mx-auto w-full max-w-6xl px-5 md:px-8";
const section = "border-t border-line py-16 md:py-20";

const policyFields = [
  ["agentId", "bytes32", "Stable identifier derived from a name; not a display label."],
  ["agent", "address", "The execution key allowed to call the guarded module."],
  ["destinationChainId", "uint256", "Chain the policy is valid on (1301 in the demo)."],
  ["destinationModule", "address", "The only contract the agent may act through."],
  ["allowedSelector", "bytes4", "The single function selector the agent may invoke."],
  ["maxValue", "uint256", "Per-action ceiling for the guarded operation."],
  ["expiresAt", "uint64", "Unix timestamp after which the capability is void."],
  ["epoch", "uint64", "Monotonic version; strictly newer wins on the destination."],
  ["active / policyHash", "bool / bytes32", "Revocation flag and canonical hash of all fields."],
];

const faqs = [
  {
    q: "Is revocation instant or atomic across chains?",
    a: "No. The source transaction is final on Base Sepolia when it is included. The destination mirror changes only after the Reactive transaction and its authenticated callback are confirmed on Unichain Sepolia. The console shows the intermediate state rather than hiding it.",
  },
  {
    q: "Can SCOPECAST undo a transaction that already executed?",
    a: "No. It blocks future calls through modules that query the mirror. Any action included on the destination before the revoke callback arrives remains settled.",
  },
  {
    q: "Does this revoke permissions in arbitrary third-party contracts?",
    a: "No. Only contracts that integrate the mirror guard are protected. The demo includes GuardedDeFiVault as a working, auditable integration.",
  },
  {
    q: "Who can change a policy?",
    a: "The source owner only. PolicyHub rejects calls from any other address, including the agent itself. In production the owner should be a multisig or smart account with a timelock.",
  },
  {
    q: "What happens if the callback fails or the funding runs out?",
    a: "The Reactive contract pays for execution from its lREACT reserve; the destination callback is billed to the receiver in Unichain ETH. Low reserves can stall delivery. Operators can top up through the system contract or coverDebt(), and the destination admin has an emergency revoke that advances the epoch.",
  },
];

export default function Landing() {
  const deployments = readDeployments();
  const reactive = deployments?.reactive;
  const flow = readEvidence();

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <ScrollProgress />

      <ScrollAwareHeader className="z-20">
        <div className={`${container} flex min-h-16 items-center justify-between gap-4 py-3`}>
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="SCOPECAST home">
            <BrandMark size={28} className="text-flare" />
            <BrandWordmark width={168} className="text-ink" />
          </Link>
          <nav className="hidden items-center gap-6 font-mono text-[14px] uppercase tracking-[0.14em] text-ink-3 lg:flex" aria-label="Main navigation">
            <a href="#problem" className="hover:text-flare">Problem</a>
            <a href="#how" className="hover:text-flare">How it works</a>
            <a href="#policy" className="hover:text-flare">Policy</a>
            <a href="#status" className="hover:text-flare">Status</a>
            <a href="https://github.com/trinnode/scopecast" target="_blank" rel="noreferrer" className="hover:text-flare">GitHub</a>
            <Link href="/console" className="flex items-center gap-2 border border-flare px-4 py-2.5 text-flare transition-colors hover:bg-flare hover:text-canvas">Open console <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </nav>
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/console" className="flex items-center gap-2 border border-flare px-3 py-2 font-mono text-[14px] text-flare">Console <ArrowUpRight size={14} aria-hidden="true" /></Link>
            <MobileMenu links={[
              { href: "#problem", label: "Problem" },
              { href: "#how", label: "How it works" },
              { href: "#policy", label: "Policy" },
              { href: "#status", label: "Build status" },
              { href: "https://github.com/trinnode/scopecast", label: "GitHub", external: true },
              { href: "/console", label: "Open console" },
            ]} />
          </div>
        </div>
      </ScrollAwareHeader>

      <main>
        <section className="noise relative overflow-hidden border-b border-line">
          <BackgroundMotion />
          <div className={`${container} relative z-10 grid gap-12 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center`}>
            <div>
              <Overline>Reactive Omni Buildathon · Every Second Counts</Overline>
              <h1 className="mt-6 text-[38px] leading-[1.08] sm:text-[50px] lg:text-[58px]">
                Revoke once.
                <br />
                <GradientText>Enforce everywhere.</GradientText>
              </h1>
              <p className="mt-7 max-w-[56ch] text-[19px] leading-7 text-ink-2">
                <RevealText text="SCOPECAST is a cross-chain capability registry for delegated DeFi agents. One owner action on Base Sepolia produces a versioned policy event; a Reactive contract validates it and mirrors it to a guarded execution module on Unichain Sepolia." />
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/console" className="moving-border flex items-center gap-2 border border-flare px-5 py-3 font-mono text-[15px] font-bold uppercase tracking-[0.14em] text-flare">Open the console <ArrowUpRight size={15} aria-hidden="true" /></Link>
                <Link href="/console/architecture" className="font-mono text-[15px] uppercase tracking-[0.12em] text-ink-3 underline decoration-line-strong underline-offset-8 hover:text-flare">Read the architecture</Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 font-mono text-[14px] uppercase tracking-[0.1em] text-ink-3">
                <span><span className="text-flare">01</span> Base Sepolia · 84532</span>
                <span><span className="text-flare">02</span> Reactive Lasna · 5318007</span>
                <span><span className="text-flare">03</span> Unichain Sepolia · 1301</span>
              </div>
            </div>

            <TiltCard>
              <SpotlightCard className="border border-line-strong bg-[#08080A]/85 p-5 backdrop-blur-xl">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <Overline>Cross-chain route</Overline>
                  <span className="border border-amber/60 px-2 py-1 font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-amber">Illustration</span>
                </div>
                <div className="tilt-inner">
                  <RouteScene3D />
                </div>
                <div className="mt-5 grid gap-3 border-t border-line pt-5 font-mono text-[13px] text-ink-3 sm:grid-cols-3">
                  <span><span className="text-flare">01</span> source event</span>
                  <span><span className="text-iris">02</span> react + callback</span>
                  <span><span className="text-blush">03</span> guarded action</span>
                </div>
              </SpotlightCard>
            </TiltCard>
          </div>
        </section>

        <section id="problem" className={section}>
          <div className={container}>
            <ScrollReveal>
              <Overline>01 · The problem</Overline>
              <h2 className="mt-4 max-w-[22ch] text-[30px] leading-tight md:text-[36px]">Delegated authority is fragmented across integrations.</h2>
              <p className="mt-5 max-w-[70ch] text-[18px] leading-7 text-ink-2">
                An autonomous agent can hold scoped permissions in several protocol integrations and on several chains.
                Each integration keeps its own local state. Revoking one session on one chain does not update the others
                until someone submits a separate transaction to each of them.
              </p>
            </ScrollReveal>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                ["No single control plane", "The owner has to find and update every integration where the agent has authority."],
                ["Operational delay", "Each chain-specific update is a separate transaction with its own confirmation time."],
                ["No shared proof", "There is no canonical trail linking a source revocation to destination enforcement."],
              ].map(([title, body], i) => (
                <ScrollReveal key={title} delay={i * 70}>
                  <SpotlightCard className="h-full border border-line bg-surface p-6">
                    <span className="mono text-[14px] text-flare">0{i + 1}</span>
                    <h3 className="mt-5 text-[19px]">{title}</h3>
                    <p className="mt-3 text-[17px] leading-6 text-ink-2">{body}</p>
                  </SpotlightCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className={`${section} bg-[#08080A]`}>
          <div className={container}>
            <ScrollReveal>
              <Overline>02 · How it works</Overline>
              <h2 className="mt-4 text-[30px] md:text-[36px]">Four steps, each independently verifiable.</h2>
            </ScrollReveal>
            <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-4">
              {[
                {
                  n: "01",
                  title: "Authorise on source",
                  body: "The owner calls PolicyHub on Base Sepolia. Every create, update, rotate and revoke increments an epoch and emits PolicyUpdated with all nine capability fields.",
                },
                {
                  n: "02",
                  title: "Validate in Reactive",
                  body: "ScopeCastReactive checks chain ID, emitter address, event signature, topic count (opCode 3) and the canonical policy hash before acting. Unrelated logs return without reverting.",
                },
                {
                  n: "03",
                  title: "Request callback",
                  body: "The Reactive contract calls requestCallbackV_1_0 with the destination chain, mirror address, gas limit and ABI payload. The network injects the sender into the first address argument.",
                },
                {
                  n: "04",
                  title: "Enforce at the module",
                  body: "PolicyMirror accepts only the official proxy and the authorised Reactive contract, applies strictly newer epochs, and GuardedDeFiVault checks the mirrored state on every call.",
                },
              ].map((step) => (
                <ScrollReveal key={step.n} className="h-full">
                  <div className="h-full bg-[#08080A] p-6">
                    <span className="mono text-[14px] text-flare">{step.n}</span>
                    <h3 className="mt-5 text-[18px]">{step.title}</h3>
                    <p className="mt-3 text-[17px] leading-6 text-ink-2">{step.body}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="policy" className={section}>
          <div className={`${container} grid gap-10 lg:grid-cols-[0.75fr_1.25fr]`}>
            <ScrollReveal>
              <Overline>03 · The policy</Overline>
              <h2 className="mt-4 text-[30px] leading-tight md:text-[36px]">A versioned capability, not a kill switch.</h2>
              <p className="mt-5 text-[18px] leading-7 text-ink-2">
                Every field is covered by one canonical hash. The same hash is emitted on the source, recomputed by the
                Reactive contract, verified again by the mirror, and carried into the audit trail.
              </p>
              <p className="mt-5 border-l-2 border-flare pl-4 font-mono text-[15px] leading-5 text-ink-3">
                topic0 = 0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9
              </p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <div className="border border-line">
                <div className="grid grid-cols-[1fr_0.8fr] gap-4 border-b border-line bg-surface px-5 py-3 font-mono text-[14px] uppercase tracking-[0.12em] text-ink-3 md:grid-cols-[0.9fr_0.7fr_2fr]">
                  <span>Field</span><span className="hidden md:block">Type</span><span>Meaning</span>
                </div>
                {policyFields.map(([field, type, meaning]) => (
                  <div key={field} className="grid grid-cols-[1fr_0.8fr] gap-4 border-b border-line px-5 py-3 last:border-b-0 md:grid-cols-[0.9fr_0.7fr_2fr]">
                    <span className="mono text-[15px] text-ink">{field}</span>
                    <span className="mono hidden text-[15px] text-ink-3 md:block">{type}</span>
                    <span className="text-[16px] leading-5 text-ink-2">{meaning}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className={`${section} bg-[#08080A]`}>
          <div className={container}>
            <ScrollReveal>
              <Overline>04 · Security model</Overline>
              <h2 className="mt-4 text-[30px] md:text-[36px]">Fail closed, in the right order.</h2>
            </ScrollReveal>
            <div className="mt-10 grid gap-3 md:grid-cols-2">
              {[
                ["Dual callback authentication", "PolicyMirror requires onlyServiceProvider (the caller is the official callback proxy) and onlyCallbackSender (the injected sender is the one authorised Reactive contract). Neither check alone is sufficient."],
                ["Monotonic epochs", "A callback at epoch n is ignored if the mirror already holds epoch n or newer. A delayed revoke cannot be overwritten by an older grant, and duplicate deliveries are harmless."],
                ["Scoped execution", "GuardedDeFiVault checks active state, caller identity, chain, target, selector, expiry and cap. Its agent entry point accepts no arbitrary recipient or external target."],
                ["Visible failure modes", "The console renders SOURCE_REVOKED separately from DESTINATION_REVOKED, and shows UNKNOWN when a receipt cannot be independently verified."],
              ].map(([title, body]) => (
                <ScrollReveal key={title}>
                  <SpotlightCard className="h-full border border-line bg-surface p-6">
                    <div className="flex items-center gap-3"><Check size={16} className="text-flare" aria-hidden="true" /><h3 className="text-[18px]">{title}</h3></div>
                    <p className="mt-4 text-[17px] leading-6 text-ink-2">{body}</p>
                  </SpotlightCard>
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal>
              <div className="mt-6 border border-amber/30 bg-tint-pending p-6">
                <div className="flex items-center gap-3"><AlertTriangle size={16} className="text-amber" aria-hidden="true" /><h3 className="text-[18px]">Known limitations</h3></div>
                <ul className="mt-4 grid gap-2 text-[17px] leading-6 text-ink-2 md:grid-cols-2">
                  <li>— Propagation is asynchronous; no atomic cross-chain revocation.</li>
                  <li>— Settled transactions are never reversed.</li>
                  <li>— Only modules that query the mirror are protected.</li>
                  <li>— Callback funding exhaustion can interrupt delivery.</li>
                  <li>— The source owner must be a multisig in production.</li>
                  <li>— Testnet chain parameters are rechecked before each deploy.</li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className={`${section} bg-[#08080A]`}>
          <div className={container}>
            <ScrollReveal>
              <Overline>Who it is for</Overline>
              <h2 className="mt-4 max-w-[24ch] text-[30px] leading-tight md:text-[36px]">Built for teams that delegate authority.</h2>
              <p className="mt-5 max-w-[70ch] text-[18px] leading-8 text-ink-2">Each role needs a different view of the same policy state. The console keeps one source of truth for all of them.</p>
            </ScrollReveal>
            <ScrollReveal delay={80} className="mt-10">
              <Carousel items={[
                { tag: "PROTOCOL", title: "Integration engineer", body: "Add the guard to an execution module and read the mirrored policy before every agent call." },
                { tag: "OPERATIONS", title: "Security engineer", body: "See the exact epoch, target, selector and cap on source and destination, with real transaction links." },
                { tag: "TREASURY", title: "DAO operator", body: "Authorise one bounded strategy on a source chain and revoke it without editing each destination." },
                { tag: "INFRASTRUCTURE", title: "Agent provider", body: "Give each session key a narrow scope and prove to users that a revoke reached every integrated chain." },
              ]} />
            </ScrollReveal>
          </div>
        </section>

        <section id="status" className={section}>
          <div className={container}>
            <ScrollReveal>
              <Overline>05 · Build status</Overline>
              <h2 className="mt-4 text-[30px] md:text-[36px]">What is proven, and what is not yet.</h2>
              <p className="mt-5 max-w-[70ch] text-[18px] leading-7 text-ink-2">
                Entries below are recorded only from independently checked RPC receipts. Null values mean not deployed
                or not verified — never assumed.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={60}>
              <div className="mt-8 border border-line">
                <div className="grid grid-cols-[1fr_1.4fr] gap-4 border-b border-line bg-surface px-5 py-3 font-mono text-[14px] uppercase tracking-[0.12em] text-ink-3">
                  <span>Item</span><span>Verified state</span>
                </div>
                {[
                  ["Solidity test suite", "51 tests passing — unit, fuzz and full local lifecycle harness"],
                  ["ScopeCastReactive on Lasna", reactive?.address ?? "Not deployed"],
                  ["Reactive funding", reactive?.depositTx ? "lREACT reserve deposited, debt 0" : "Not funded"],
                  ["PolicyHub on Base Sepolia", deployments?.source?.address ?? "Not deployed"],
                  ["PolicyMirror + vault on Unichain", deployments?.destination?.mirror ?? "Not deployed"],
                  ["Live origin → callback proof", flow.verified ? `Verified · ${flow.propagationMs} ms revoke path (source → destination)` : "Not yet recorded"],
                  ["Post-revoke enforcement", flow.verified ? "eth_call denied with AgentPolicyInactive (0x5aff86e7)" : "Not yet recorded"],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[1fr_1.4fr] gap-4 border-b border-line px-5 py-3 last:border-b-0">
                    <span className="mono text-[15px] text-ink">{k}</span>
                    <span className="mono break-all text-[15px] text-ink-2">{v || "Not deployed"}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className={section}>
          <div className={container}>
            <ScrollReveal>
              <Overline>06 · Frequently asked questions</Overline>
              <h2 className="mt-4 text-[30px] md:text-[36px]">Clear answers, no hidden claims.</h2>
            </ScrollReveal>
            <ScrollReveal>
            <div className="mt-8 border-t border-line">
              {faqs.map((faq) => (
                <details key={faq.q} className="group border-b border-line py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px] text-ink marker:hidden">
                    {faq.q}
                    <Minus size={16} className="shrink-0 rotate-45 text-flare transition-transform duration-300 group-open:rotate-0" aria-hidden="true" />
                  </summary>
                  <p className="mt-4 max-w-[76ch] text-[17px] leading-6 text-ink-2">{faq.a}</p>
                </details>
              ))}
            </div>
            </ScrollReveal>
          </div>
        </section>

        <ScrollReveal>
        <section className="border-t border-line bg-[#08080A]">
          <div className={`${container} flex flex-wrap items-center justify-between gap-6 py-14`}>
            <div>
              <h2 className="text-[24px] md:text-[30px]">Inspect the implementation.</h2>
              <p className="mt-3 max-w-[52ch] text-[17px] leading-6 text-ink-2">Contracts, tests, runbook and sourced research are public. The console reads live chain state and refuses to guess.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/console" className="border border-flare px-4 py-3 font-mono text-[14px] uppercase tracking-[0.14em] text-flare hover:bg-flare hover:text-canvas">Open console</Link>
              <a href="https://github.com/trinnode/scopecast" target="_blank" rel="noreferrer" className="border border-line-strong px-4 py-3 font-mono text-[14px] uppercase tracking-[0.14em] text-ink-2 hover:border-flare hover:text-flare">Source repository ↗</a>
            </div>
          </div>
        </section>
        </ScrollReveal>
      </main>

      <footer className="border-t border-line">
        <div className={`${container} flex flex-wrap items-center justify-between gap-5 py-8 font-mono text-[14px] uppercase tracking-[0.1em] text-ink-3`}>
          <BrandWordmark width={120} className="text-ink-3" />
          <span>Testnet build · not audited · no mainnet funds</span>
          <span>Revoke once. Enforce everywhere.</span>
        </div>
      </footer>
    </div>
  );
}
