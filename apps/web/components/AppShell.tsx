"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileClock, FileCog, Gauge, KeyRound, LayoutDashboard, Network, ShieldAlert, Terminal } from "lucide-react";
import { NavLink, Overline, truncateHex } from "./ui";
import { BrandMark, BrandWordmark } from "./Brand";
import { ScrollProgress, ScrollReveal } from "./effects";
import { useWallet } from "./WalletProvider";

const groups = [
  {
    name: "OPERATE",
    links: [
      { href: "/console", label: "Overview", icon: LayoutDashboard },
      { href: "/console/policies", label: "Agent policies", icon: KeyRound },
      { href: "/console/propagation", label: "Propagation", icon: Activity },
      { href: "/console/demo", label: "Guarded DeFi", icon: Terminal },
    ],
  },
  {
    name: "GOVERN",
    links: [
      { href: "/console/create", label: "Authorise policy", icon: FileCog },
      { href: "/console/revoke", label: "Revoke", icon: ShieldAlert },
      { href: "/console/audit", label: "Audit trail", icon: FileClock },
    ],
  },
  {
    name: "CONFIGURE",
    links: [
      { href: "/console/diagnostics", label: "Diagnostics", icon: Gauge },
      { href: "/console/architecture", label: "Architecture", icon: Network },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address, chainId, connect, connecting, error, switchToBase, switchToUnichain } = useWallet();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <ScrollProgress />
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-[#08080A] lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-line px-6">
          <BrandMark size={26} className="text-flare" />
          <BrandWordmark width={140} className="text-ink" />
        </div>
        <nav className="flex-1 overflow-y-auto py-6" aria-label="Console navigation">
          {groups.map((group) => (
            <div key={group.name} className="mb-7 px-3">
              <div className="px-3 pb-2"><Overline>{group.name}</Overline></div>
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <NavLink key={link.href} href={link.href} active={active}>
                    <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-6 font-mono text-[10px] leading-5 tracking-[0.06em] text-ink-3">
          <p className="text-flare">84532 → 5318007 → 1301</p>
          <p className="mt-2">REVOKE ONCE. ENFORCE EVERYWHERE.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas/90 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">scopecast / console</span>
            <span className="hidden text-[11px] text-line-strong sm:inline">/</span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-ink sm:inline">
              {pathname.split("/").filter(Boolean).slice(1).join(" / ") || "overview"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {address ? (
              <>
                <button onClick={() => void switchToBase()} className="border border-line px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2 hover:border-flare hover:text-flare">Base</button>
                <button onClick={() => void switchToUnichain()} className="border border-line px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2 hover:border-flare hover:text-flare">Unichain</button>
                <span className="mono border border-line bg-surface px-2 py-1.5 text-[10px]" title={`Chain ${chainId ?? "unknown"}`}>{truncateHex(address, 6, 4)}</span>
              </>
            ) : (
              <button
                onClick={() => void connect()}
                disabled={connecting}
                className="moving-border border border-flare/60 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-flare disabled:opacity-50"
              >
                {connecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
          </div>
        </header>
        {error && (
          <div className="border-b border-blush/40 bg-tint-revoked px-4 py-2 font-mono text-[11px] text-blush" role="alert">! {error}</div>
        )}
        <nav className="lg:hidden" aria-label="Mobile console navigation">
          <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groups.flatMap((g) => g.links).map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] ${
                    active ? "border-flare text-flare" : "border-line text-ink-3"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-10 md:px-8"><ScrollReveal>{children}</ScrollReveal></main>
        <footer className="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-4 pb-10 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3 md:px-8">
          <div className="h-px w-full bg-line" />
          <BrandWordmark width={110} className="text-ink-3" />
          <span>Testnet build · not audited</span>
          <a className="text-flare hover:underline" href="https://github.com/trinnode/scopecast" target="_blank" rel="noreferrer">Source ↗</a>
        </footer>
      </div>
    </div>
  );
}
