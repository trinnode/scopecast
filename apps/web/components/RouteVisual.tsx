"use client";

import { truncateHex } from "@/lib/format";
import type { PolicyStatus } from "@/lib/status";

type Stage = {
  label: string;
  sub: string;
  hash?: string;
  url?: string;
  state: "complete" | "active" | "pending" | "unknown" | "revoked";
};

export function RouteVisual({
  stages,
  status,
  simulation = false,
}: {
  stages: Stage[];
  status: PolicyStatus;
  simulation?: boolean;
}) {
  const revoked = status.includes("REVOKED");
  const live = status.includes("ACTIVE") || status.includes("PROCESSED");
  const lineClass = revoked ? "signal-line--revoked" : status.includes("PENDING") ? "signal-line--pending" : live ? "signal-line" : "signal-line--unknown";

  return (
    <div className="relative border border-line-strong bg-[#08080A]/90 p-5 md:p-6" aria-label="Policy propagation route">
      {simulation && (
        <span className="absolute right-4 top-4 border border-amber/60 bg-tint-pending px-2 py-1 font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-amber">◐ Simulation</span>
      )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_46px_minmax(0,1fr)_46px_minmax(0,1fr)] md:items-center">
        {stages.map((stage, i) => (
          <div key={stage.label} className="contents">
            <div className="flex min-w-0 flex-col items-center text-center">
              <NodeState state={stage.state} />
              <p className="mt-3 font-display text-[14px] font-bold uppercase leading-4 tracking-[-0.02em] text-ink md:text-[15px]">{stage.label}</p>
              <p className="mt-1 font-mono text-[13px] uppercase leading-4 tracking-[0.04em] text-ink-3">{stage.sub}</p>
              <div className="mt-2">
                {stage.hash ? (
                  stage.url ? (
                    <a href={stage.url} target="_blank" rel="noopener noreferrer" className="mono text-[14px] text-flare hover:underline">
                      {truncateHex(stage.hash, 10, 8)} ↗
                    </a>
                  ) : (
                    <span className="mono text-[14px] text-ink-2">{stage.hash}</span>
                  )
                ) : (
                  <span className="mono text-[14px] text-fog">NO VERIFIED RECEIPT</span>
                )}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className="relative hidden h-[2px] w-full md:block">
                <div className={`h-full w-full ${lineClass}`} />
                {(stage.state === "active" || status === "CALLBACK_REQUESTED") && (
                  <span className="sc-propagation-pulse absolute inset-y-0 left-0 w-4 animate-signal-travel bg-white" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 border-t border-line pt-4 font-mono text-[14px] leading-4 uppercase tracking-[0.08em] text-ink-3">
        A stage completes only after its receipt is verified on that chain. Source finality is not destination enforcement.
      </p>
    </div>
  );
}

function NodeState({ state }: { state: Stage["state"] }) {
  const map = {
    complete: { glyph: "▶", cls: "border-flare bg-tint-active text-flare" },
    active: { glyph: "◐", cls: "border-amber bg-tint-pending text-amber" },
    pending: { glyph: "○", cls: "border-line-strong bg-surface text-fog" },
    unknown: { glyph: "?", cls: "border-line-strong bg-surface text-fog" },
    revoked: { glyph: "⊘", cls: "border-blush bg-tint-revoked text-blush" },
  }[state];
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center border text-[17px] ${map.cls}`} aria-label={state}>
      {map.glyph}
    </span>
  );
}
