"use client";

const S = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/// Original micro-glyphs derived from the brand gate geometry.
export function RoleGlyph({ kind }: { kind: "engineer" | "security" | "treasury" | "provider" }) {
  if (kind === "engineer") return (
    <svg {...S} aria-hidden="true"><path d="M4 12h6m4 0h6M10 8v8m4-8v8" /><circle cx="4" cy="12" r="1.5" /><path d="M20 9v6" /></svg>
  );
  if (kind === "security") return (
    <svg {...S} aria-hidden="true"><path d="M4 12h16M10 8v8m4-8v8" /><path d="M3 5h5v4H3zM16 15h5v4h-5z" /></svg>
  );
  if (kind === "treasury") return (
    <svg {...S} aria-hidden="true"><circle cx="7" cy="12" r="3" fill="currentColor" fillOpacity=".25" /><path d="M10 12h8m-3-3 3 3-3 3" /><path d="M19 7v10" /></svg>
  );
  return (
    <svg {...S} aria-hidden="true"><circle cx="12" cy="12" r="7" strokeDasharray="2 2" /><path d="M12 5v14M5 12h14" /><circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity=".3" /></svg>
  );
}

export function DualBoltGlyph() {
  return <svg {...S} aria-hidden="true"><path d="M4 12h5m6 0h5" /><path d="M9 6v12m6-12v12" /><path d="M9 8h6M9 16h6" /><circle cx="4" cy="12" r="1.5" fill="currentColor" /><circle cx="20" cy="12" r="1.5" fill="currentColor" /></svg>;
}
export function EpochStackGlyph() {
  return <svg {...S} aria-hidden="true"><path d="M3 6h16M3 10h16M3 14h16M3 18h16" /><path d="M5 18l14-14" strokeWidth="2" /></svg>;
}
export function ScopedGateGlyph() {
  return <svg {...S} aria-hidden="true"><circle cx="5" cy="12" r="2" fill="currentColor" fillOpacity=".35" /><path d="M7 12h9M16 8v8m0-8h4v8h-4" /><path d="M20 12h2" strokeDasharray="2 2" /></svg>;
}
export function LineKeyGlyph() {
  return <svg {...S} aria-hidden="true"><path d="M3 5h18" /><path d="M3 10h18" strokeDasharray="3 2" /><path d="M3 15h7m4 0h7" /><path d="M3 20h18" strokeDasharray="1 2" /></svg>;
}

/// Nine field sigils converging into one hash tile, replicated at three stages.
export function CapabilityFingerprint() {
  const sigils = ["ID", "AG", "CH", "MD", "SEL", "CAP", "EXP", "EP", "ACT"];
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <p className="overline">Capability fingerprint</p>
      <div className="mt-5 grid grid-cols-9 gap-1" aria-hidden="true">
        {sigils.map((s, i) => (
          <span key={s} className="fingerprint-bar flex h-9 items-center justify-center border border-line-strong bg-canvas font-mono text-[10px] text-ink-2" style={{ animationDelay: `${i * 55}ms` }}>
            {s}
          </span>
        ))}
      </div>
      <div className="mt-2 flex justify-center"><span className="h-8 w-px bg-gradient-to-b from-flare to-transparent" /></div>
      <div className="grid grid-cols-3 gap-3">
        {["EMIT", "RECOMPUTE", "VERIFY"].map((stage) => (
          <div key={stage}>
            <div className="fingerprint-bar h-9 border border-flare/40 bg-tint-active font-mono text-[13px] text-flare flex items-center justify-center">0xd160…</div>
            <p className="mono mt-2 text-center text-[13px] text-ink-3">{stage}</p>
          </div>
        ))}
      </div>
      <p className="mono mt-4 text-[13px] text-ink-3">one hash binds all nine policy fields</p>
    </div>
  );
}

/// The brand's cut channel: final source, in-flight callback, settled-not-reversed.
export function CutChannel() {
  return (
    <div className="mt-6 rounded-lg border border-amber/30 bg-tint-pending p-5">
      <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
        <span className="flex h-9 w-9 items-center justify-center border border-flare bg-tint-active font-mono text-[13px] text-flare">01</span>
        <span className="h-[2px] w-16 bg-flare" />
        <span className="h-[2px] w-16 signal-line--pending" />
        <span className="h-[2px] w-16 signal-line--revoked" />
        <span className="flex h-9 w-9 items-center justify-center border border-blush bg-tint-revoked font-mono text-[13px] text-blush">03</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[13px] uppercase tracking-[0.08em] text-ink-3">
        <span>Source final</span><span>Callback in flight</span><span>Settled — not reversed</span><span>Destination</span>
      </div>
    </div>
  );
}

export function VerificationRail({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-block h-8 w-[3px] shrink-0 ${verified ? "bg-flare" : "signal-line--unknown"}`}
      aria-hidden="true"
    />
  );
}
