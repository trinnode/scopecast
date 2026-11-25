"use client";

import { truncateHex } from "./ui";
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
  const lineClass = revoked ? "signal-line--revoked" : status.includes("PENDING") ? "signal-line--pending" : status.includes("ACTIVE") || status.includes("PROCESSED") ? "signal-line" : "signal-line--unknown";

  return (
    <div className="relative rounded-lg border border-line-strong bg-surface-2 p-6" aria-label="Policy propagation route">
      {simulation && (
        <span className="absolute right-4 top-4 rounded-xs border border-amber/60 bg-tint-pending px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-amber">
          ◐ Simulation
        </span>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        {stages.map((stage, i) => (
          <div key={stage.label} className="contents">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <NodeState state={stage.state} />
                <div>
                  <p className="font-display text-[15px] font-semibold text-ink">{stage.label}</p>
                  <p className="text-[12px] text-ink-3">{stage.sub}</p>
                </div>
              </div>
              {stage.hash ? (
                stage.url ? (
                  <a
                    href={stage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono ml-8 text-[11px] text-cyan hover:underline"
                  >
                    {truncateHex(stage.hash, 10, 8)} ↗
                  </a>
                ) : (
                  <span className="mono ml-8 text-[11px] text-ink-3">{truncateHex(stage.hash, 10, 8)}</span>
                )
              ) : (
                <span className="mono ml-8 text-[11px] text-fog">NO TX OBSERVED</span>
              )}
            </div>
            {i < stages.length - 1 && (
              <div className="relative hidden h-[2px] w-16 overflow-hidden md:block">
                <div className={`h-full w-full ${lineClass}`} />
                {(stage.state === "active" || status === "CALLBACK_REQUESTED") && (
                  <span className="sc-propagation-pulse absolute inset-y-0 left-0 w-3 animate-signal-travel bg-cyan" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 border-t border-line pt-4 text-[12px] text-ink-3">
        A stage is marked complete only after its receipt is verified on that chain. Source finality is not
        destination enforcement.
      </p>
    </div>
  );
}

function NodeState({ state }: { state: Stage["state"] }) {
  const map = {
    complete: { cls: "border-cyan bg-tint-active", glyph: "▶", label: "complete" },
    active: { cls: "border-amber bg-tint-pending", glyph: "◐", label: "in flight" },
    pending: { cls: "border-fog bg-tint-unknown", glyph: "○", label: "pending" },
    unknown: { cls: "border-fog bg-tint-unknown", glyph: "?", label: "unknown" },
    revoked: { cls: "border-vermilion bg-tint-revoked", glyph: "⊘", label: "revoked" },
  }[state];
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border text-[14px] ${map.cls}`}
      title={map.label}
      aria-label={map.label}
    >
      {map.glyph}
    </span>
  );
}
