"use client";

import { usePathname } from "next/navigation";
import { Activity, FileClock, FileCog, Gauge, KeyRound, LayoutDashboard, ListTree, Network, ShieldAlert, Stethoscope } from "lucide-react";
import { NavLink, Overline, truncateHex } from "./ui";
import { useWallet } from "./WalletProvider";

const groups = [
  {
    name: "OPERATE",
    links: [
      { href: "/console", label: "Security overview", icon: LayoutDashboard },
      { href: "/console/policies", label: "Agent policies", icon: KeyRound },
      { href: "/console/propagation", label: "Propagation timeline", icon: Activity },
      { href: "/console/demo", label: "Guarded DeFi demo", icon: Stethoscope },
    ],
  },
  {
    name: "GOVERN",
    links: [
      { href: "/console/create", label: "Create / update policy", icon: FileCog },
      { href: "/console/revoke", label: "Revoke across chains", icon: ShieldAlert },
      { href: "/console/audit", label: "Audit explorer", icon: FileClock },
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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-14 items-center gap-3 border-b border-line px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/scopecast-mark.svg" alt="" className="h-7 w-7 text-cyan" />
          <span className="font-display text-[15px] font-bold tracking-[-0.01em]">SCOPECAST</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-5" aria-label="Console navigation">
          {groups.map((group) => (
            <div key={group.name} className="mb-6">
              <div className="px-5 pb-2">
                <Overline>{group.name}</Overline>
              </div>
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <div key={link.href} className="px-2">
                    <NavLink href={link.href} active={active}>
                      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                      {link.label}
                    </NavLink>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-4 text-[11px] text-ink-3">
          <p className="mono">BASE 84532 · LASNA 5318007 · UNICHAIN 1301</p>
          <p className="mt-1">Revoke once. Enforce everywhere.</p>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-line bg-surface/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-[14px] font-semibold text-ink-2">Security console</span>
            <span className="hidden text-[12px] text-ink-3 sm:inline">/ {pathname.split("/").filter(Boolean).slice(1).join(" / ") || "overview"}</span>
          </div>
          <div className="flex items-center gap-2">
            {address ? (
              <>
                <button
                  onClick={switchToBase}
                  className="rounded-sm border border-line-input px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-2 hover:bg-elevated"
                  aria-label="Switch wallet to Base Sepolia"
                >
                  Base
                </button>
                <button
                  onClick={switchToUnichain}
                  className="rounded-sm border border-line-input px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-2 hover:bg-elevated"
                  aria-label="Switch wallet to Unichain Sepolia"
                >
                  Unichain
                </button>
                <span className="mono rounded-sm border border-line bg-surface-2 px-2 py-1 text-[11px]" title={`Chain ${chainId ?? "unknown"}`}>
                  {truncateHex(address, 6, 4)}
                </span>
              </>
            ) : (
              <button
                onClick={() => void connect()}
                disabled={connecting}
                className="rounded-sm border border-cyan/60 bg-tint-active px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-cyan hover:bg-cyan/10 disabled:opacity-50"
              >
                {connecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
          </div>
        </header>
        {error && (
          <div className="border-b border-vermilion/40 bg-tint-revoked px-4 py-2 text-[12px] text-vermilion" role="alert">
            ! {error}
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-10 text-[11px] text-ink-3 md:px-6">
          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/scopecast-wordmark.svg" alt="SCOPECAST" className="h-4 w-auto text-ink-3" />
            <span>Testnet build · not audited · no mainnet funds</span>
            <a className="text-cyan hover:underline" href="https://github.com/trinnode/scopecast" target="_blank" rel="noreferrer">
              Source ↗
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
