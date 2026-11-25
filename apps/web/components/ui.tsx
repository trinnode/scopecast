"use client";

import Link from "next/link";
import { STATUS_META, toneClasses, type PolicyStatus } from "@/lib/status";

export function Overline({ children }: { children: React.ReactNode }) {
  return <div className="overline">{children}</div>;
}

export function StatusChip({ status, compact = false }: { status: PolicyStatus; compact?: boolean }) {
  const meta = STATUS_META[status];
  const tone = toneClasses(meta.tone);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${tone.text} ${tone.bg} ${tone.border}`}
      aria-label={`Status: ${meta.label}`}
    >
      <span aria-hidden="true" className="text-[13px] leading-none">
        {meta.icon}
      </span>
      {!compact && meta.label}
    </span>
  );
}

export function Mono({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span className="mono text-[12px] text-ink-2" title={title}>
      {children}
    </span>
  );
}

export function truncateHex(value: string, head = 8, tail = 6) {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function TestnetBanner() {
  return (
    <div className="flex items-start gap-3 border-b border-amber/30 bg-tint-pending px-4 py-2 text-[12px] text-amber">
      <span aria-hidden="true" className="mt-0.5 text-[14px]">
        ◐
      </span>
      <p>
        <strong>TESTNET ONLY.</strong> All tokens, balances and transactions are valueless test assets.
        SCOPECAST cannot reverse settled actions and does not provide atomic cross-chain revocation.
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
  return <section className={`card ${railClass} p-6 ${className}`}>{children}</section>;
}

export function PageHeader({ title, description, kicker }: { title: string; description?: string; kicker?: string }) {
  return (
    <header className="mb-8">
      {kicker && <Overline>{kicker}</Overline>}
      <h1 className="mt-2 text-[28px] font-bold leading-9 tracking-[-0.02em] text-ink">{title}</h1>
      {description && <p className="mt-2 max-w-[68ch] text-[14px] text-ink-2">{description}</p>}
    </header>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Card className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
      <span aria-hidden="true" className="text-2xl text-fog">
        ?
      </span>
      <p className="font-display text-[16px] text-ink">{title}</p>
      <p className="max-w-[52ch] text-[13px] text-ink-3">{hint}</p>
    </Card>
  );
}

export function ExplorerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mono text-[12px] text-cyan underline decoration-cyan/40 underline-offset-4 hover:decoration-cyan"
    >
      {children}
    </a>
  );
}

export function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] transition-colors duration-200 ${
        active ? "border-l-2 border-cyan bg-tint-active text-cyan" : "border-l-2 border-transparent text-ink-3 hover:bg-elevated hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function Stat({ label, value, tone = "active" }: { label: string; value: string | number; tone?: "active" | "pending" | "revoked" | "unknown" }) {
  const t = toneClasses(tone);
  return (
    <Card className="p-4">
      <Overline>{label}</Overline>
      <div className={`mt-3 font-display text-[32px] font-bold leading-10 tabular ${t.text}`}>{value}</div>
    </Card>
  );
}
