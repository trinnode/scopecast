"use client";

import Link from "next/link";
import { SpotlightCard } from "./effects";
import { STATUS_META, toneClasses, type PolicyStatus } from "@/lib/status";

export function Overline({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px w-5 bg-gradient-to-r from-flare to-iris" />
      <span className="overline">{children}</span>
    </div>
  );
}

export function StatusChip({ status, compact = false }: { status: PolicyStatus; compact?: boolean }) {
  const meta = STATUS_META[status];
  const tone = toneClasses(meta.tone);
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2 py-1 font-mono text-[14px] font-bold uppercase tracking-[0.12em] ${tone.text} ${tone.bg} ${tone.border}`}
      aria-label={`Status: ${meta.label}`}
    >
      <span aria-hidden="true" className="text-[16px] leading-none">{meta.icon}</span>
      {!compact && meta.label}
    </span>
  );
}

export function Mono({ children, title }: { children: React.ReactNode; title?: string }) {
  return <span className="mono break-all text-[16px] text-ink-2" title={title}>{children}</span>;
}

export function TestnetBanner() {
  return (
    <div className="relative z-30 flex items-start gap-3 border-b border-amber/30 bg-[#151105] px-4 py-2 text-[15px] font-mono uppercase tracking-[0.08em] text-amber">
      <span aria-hidden="true" className="mt-px">◐</span>
      <p>
        <strong>TESTNET ONLY</strong> — valueless test assets. No retroactive reversal. No atomic cross-chain revocation.
      </p>
    </div>
  );
}

export function Card({
  children,
  className = "",
  rail,
}: {
  children: React.ReactNode;
  className?: string;
  rail?: "active" | "pending" | "revoked" | "unknown";
}) {
  const railClass = rail ? toneClasses(rail).rail : "";
  return (
    <SpotlightCard className={`card ${railClass} p-6 ${className}`}>
      {children}
    </SpotlightCard>
  );
}

export function PageHeader({ title, description, kicker }: { title: string; description?: string; kicker?: string }) {
  return (
    <header className="mb-10">
      {kicker && <Overline>{kicker}</Overline>}
      <h1 className="mt-4 text-[30px] leading-[1.15] md:text-[38px]">{title}</h1>
      {description && <p className="mt-4 max-w-[68ch] text-[18px] leading-6 text-ink-2">{description}</p>}
      <div className="gradient-underline mt-6 w-24" />
    </header>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Card className="flex min-h-44 flex-col items-center justify-center gap-4 text-center">
      <span aria-hidden="true" className="font-display text-2xl text-ink-3">?</span>
      <p className="font-display text-[19px] text-ink">{title}</p>
      <p className="max-w-[52ch] text-[17px] text-ink-3">{hint}</p>
    </Card>
  );
}

export function ExplorerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="mono text-[16px] text-flare underline decoration-flare/40 underline-offset-4 hover:decoration-flare">
      {children}
    </a>
  );
}

export function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 border-l-2 py-2.5 pl-3 pr-2 font-mono text-[15px] uppercase tracking-[0.1em] transition-colors duration-200 ${
        active ? "border-flare bg-white/[0.06] text-ink" : "border-transparent text-ink-3 hover:bg-white/[0.04] hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function Stat({ label, value, tone = "active" }: { label: string; value: string | number; tone?: "active" | "pending" | "revoked" | "unknown" }) {
  const t = toneClasses(tone);
  return (
    <Card className="p-5">
      <Overline>{label}</Overline>
      <div className={`mt-4 font-display text-[30px] leading-none tracking-[-0.04em] tabular ${t.text}`}>{value}</div>
    </Card>
  );
}
