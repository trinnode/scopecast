"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark, BrandWordmark } from "./Brand";

type Item = { href: string; label: string; external?: boolean };

export function MobileMenu({ links, groups }: { links?: Item[]; groups?: { name: string; links: Item[] }[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = groups ?? [{ name: "NAVIGATION", links: links ?? [] }];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="scopecast-mobile-menu"
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] border border-line-strong bg-surface transition-colors hover:border-flare lg:hidden"
      >
        <span className={`block h-[2px] w-5 bg-ink transition-transform duration-300 ease-enter ${open ? "translate-y-[7px] rotate-45" : ""}`} />
        <span className={`block h-[2px] w-5 bg-ink transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
        <span className={`block h-[2px] w-5 bg-ink transition-transform duration-300 ease-enter ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
      </button>

      <div
        id="scopecast-mobile-menu"
        className={`fixed inset-0 z-50 overflow-hidden lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-canvas/80 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <nav
          className={`absolute right-0 top-0 flex h-full w-[min(86vw,360px)] flex-col border-l border-line-strong bg-surface transition-transform duration-300 ease-enter ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          aria-label="Mobile navigation"
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3" aria-label="SCOPECAST home">
              <BrandMark size={26} className="text-flare" />
              <BrandWordmark width={130} className="text-ink" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
              className="flex h-10 w-10 items-center justify-center border border-line font-mono text-[17px] text-ink-2 transition-colors hover:border-flare hover:text-flare"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {items.map((group) => (
              <div key={group.name} className="mb-7">
                <p className="overline mb-3 px-2">{group.name}</p>
                {group.links.map((item) => {
                  const content = <>{item.label}<span className="ml-auto text-flare" aria-hidden="true">↗</span></>;
                  const cls = "flex items-center gap-2 border-b border-line px-2 py-3 text-left font-mono text-[15px] uppercase tracking-[0.1em] text-ink-2 transition-colors hover:text-flare";
                  return item.external ? (
                    <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className={cls} onClick={() => setOpen(false)}>{content}</a>
                  ) : (
                    <Link key={item.href} href={item.href} className={cls} onClick={() => setOpen(false)}>{content}</Link>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="border-t border-line px-6 py-5 font-mono text-[13px] text-ink-3">
            <p className="text-flare">84532 → 5318007 → 1301</p>
            <p className="mt-2">TESTNET ONLY · NO MAINNET FUNDS</p>
          </div>
        </nav>
      </div>
    </>
  );
}
