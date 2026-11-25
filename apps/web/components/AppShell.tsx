"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowLeft, FileClock, FileCog, Gauge, KeyRound, LayoutDashboard, Network, ShieldAlert, Terminal } from "lucide-react";
import { Overline } from "./ui";
import { truncateHex } from "@/lib/format";
import { BrandMark, BrandWordmark } from "./Brand";
import { ScrollProgress, ScrollReveal } from "./effects";
import { ScrollAwareHeader } from "./ScrollAwareHeader";
import { MobileMenu } from "./MobileMenu";
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
  const current = groups.flatMap((g) => g.links).find((l) => l.href === pathname)?.label ?? "Overview";
  const menuGroups = [
    { name: "SITE", links: [{ href: "/", label: "Back to landing" }, { href: "/console", label: "Console home" }] },
    ...groups.map((g) => ({ name: g.name, links: g.links.map((l) => ({ href: l.href, label: l.label })) })),
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <ScrollProgress />

      <ScrollAwareHeader className="w-full">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="SCOPECAST home">
              <BrandMark size={30} className="text-flare" />
              <BrandWordmark width={150} className="text-ink" />
            </Link>
            <span className="hidden h-6 w-px bg-line xl:block" />
            <span className="hidden truncate font-mono text-[14px] uppercase tracking-[0.12em] text-ink-3 xl:inline">console / {current}</span>
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Console navigation">
            {groups[0].links.concat(groups[1].links).map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-sm border px-3 py-2 font-mono text-[14px] uppercase tracking-[0.08em] transition-colors duration-200 ${
                    active ? "border-flare/60 bg-tint-active text-flare" : "border-transparent text-ink-3 hover:border-line hover:text-ink"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {address ? (
              <>
                <button onClick={() => void switchToBase()} className="hidden border border-line px-2 py-2 font-mono text-[14px] uppercase text-ink-2 hover:border-flare hover:text-flare sm:inline-flex">Base</button>
                <button onClick={() => void switchToUnichain()} className="hidden border border-line px-2 py-2 font-mono text-[14px] uppercase text-ink-2 hover:border-flare hover:text-flare sm:inline-flex">Unichain</button>
                <span className="mono hidden border border-line bg-surface px-2 py-2 text-[14px] md:inline-flex" title={`Chain ${chainId ?? "unknown"}`}>{truncateHex(address, 6, 4)}</span>
              </>
            ) : (
              <button
                onClick={() => void connect()}
                disabled={connecting}
                className="moving-border border border-flare/60 px-3 py-2 font-mono text-[14px] font-bold uppercase tracking-[0.12em] text-flare disabled:opacity-50 sm:px-4"
              >
                {connecting ? "Connecting…" : "Connect"}
              </button>
            )}
            <MobileMenu groups={menuGroups} />
          </div>
        </div>
      </ScrollAwareHeader>

      {error && (
        <div className="border-b border-blush/40 bg-tint-revoked px-4 py-2 font-mono text-[15px] text-blush" role="alert">! {error}</div>
      )}

      <main className="mx-auto w-full max-w-[1600px] px-4 py-10 md:px-8 md:py-14"><ScrollReveal>{children}</ScrollReveal></main>

      <footer className="mx-auto w-full max-w-[1600px] px-4 pb-12 md:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 font-mono text-[14px] uppercase tracking-[0.1em] text-ink-3">
          <BrandWordmark width={130} className="text-ink-3" />
          <span>Testnet build · not audited</span>
          <Link href="/" className="flex items-center gap-2 text-flare hover:underline"><ArrowLeft size={14} aria-hidden="true" /> Back to site</Link>
          <a className="text-flare hover:underline" href="https://github.com/trinnode/scopecast" target="_blank" rel="noreferrer">Source ↗</a>
        </div>
      </footer>
    </div>
  );
}
