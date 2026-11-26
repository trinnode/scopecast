"use client";

import { useRef } from "react";
import { OrbitRings } from "./aceternity-effects";

const nodes = [
  { label: "BASE SEPOLIA", sub: "84532 · source", tone: "from-flare/25", glyph: "01", depth: "translate3d(-175px, 14px, 40px) rotateY(16deg)" },
  { label: "REACTIVE OMNI", sub: "5318007 · reaction", tone: "from-iris/25", glyph: "02", depth: "translate3d(0, -18px, 110px) rotateY(0deg)" },
  { label: "UNICHAIN SEP.", sub: "1301 · enforcement", tone: "from-blush/20", glyph: "03", depth: "translate3d(175px, 14px, 40px) rotateY(-16deg)" },
];

function NodeCard({ node, showToken = false }: { node: (typeof nodes)[number]; showToken?: boolean }) {
  return (
    <div className={`relative h-[150px] w-[170px] rounded-lg border border-line-strong bg-gradient-to-b ${node.tone} to-[#0B0B0D]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,.55)]`}>
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-pill border border-line-strong bg-canvas font-mono text-[14px] text-ink">{node.glyph}</span>
        <span className="h-2 w-2 rounded-pill bg-current opacity-70" />
      </div>
      <p className="mt-6 font-display text-[13px] font-bold leading-5 text-ink">{node.label}</p>
      <p className="mono mt-1 text-[13px] text-ink-3">{node.sub}</p>
      {showToken && <p className="mono mt-2 truncate text-[12px] text-flare/70">0xd160…</p>}
      <div className="absolute -bottom-3 left-6 right-6 h-5 rounded-pill bg-black/40 blur-md" />
    </div>
  );
}

/// Original CSS/SVG illustration of the policy route. The desktop scene is
/// pointer-reactive; small screens get a complete vertical spine instead of a
/// clipped perspective view. Reduced motion shows a static labelled route.
export function RouteScene3D() {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current?.style.setProperty("--sy", `${px * 12}deg`);
    ref.current?.style.setProperty("--sx", `${-py * 8}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--sy", "0deg");
    ref.current?.style.setProperty("--sx", "0deg");
  };

  return (
    <figure
      className="relative h-[360px] w-full select-none overflow-hidden rounded-lg border border-line-strong bg-[#07070A] md:h-[380px]"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ perspective: "1200px" }}
      role="img"
      aria-label="Policy route: Base Sepolia emits an event, Reactive Omni validates it, Unichain Sepolia enforces the mirrored policy"
    >
      <figcaption className="sr-only">Base Sepolia to Reactive Omni to Unichain Sepolia policy route</figcaption>
      <div className="absolute inset-0 surface-grid opacity-50" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-iris/10 blur-[80px]" />

      {/* Vertical spine for narrow screens: no clipping, no pointer dependency. */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-4 md:hidden">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex w-full items-center gap-3">
            <span className="w-6 shrink-0 font-mono text-[13px] text-flare">{node.glyph}</span>
            <div className={`flex-1 border border-line-strong bg-gradient-to-r ${node.tone} to-[#0B0B0D]/90 px-4 py-3`}>
              <p className="font-display text-[13px] font-bold text-ink">{node.label}</p>
              <p className="mono mt-1 text-[13px] text-ink-3">{node.sub}</p>
            </div>
            {i < nodes.length - 1 && <span className="absolute left-[46px] mt-16 h-4 w-px bg-gradient-to-b from-flare to-iris" />}
          </div>
        ))}
        <p className="mono mt-2 text-center text-[13px] text-ink-3">01 SOURCE → 02 REACT → 03 ENFORCE</p>
      </div>

      {/* Desktop perspective scene. */}
      <div className="absolute inset-0 hidden md:block">
        <div
          ref={ref}
          className="scene-core absolute inset-0"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(var(--sx,0deg)) rotateY(var(--sy,0deg))" }}
        >
          <OrbitRings />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 50 L50 50 L80 50" stroke="url(#routeGradient)" strokeWidth="0.4" fill="none" markerEnd="url(#arrow)" />
            <defs>
              <linearGradient id="routeGradient" x1="0" x2="1"><stop stopColor="#00F0FF" /><stop offset="1" stopColor="#FF3D81" /></linearGradient>
              <marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0 L4 2 L0 4 z" fill="#FF3D81" /></marker>
            </defs>
          </svg>
          <span className="sc-propagation-pulse absolute left-1/2 top-1/2 h-[3px] w-14 -translate-y-1/2 animate-signal-travel rounded-pill bg-white" style={{ ["--signal-distance" as string]: "340px" }} />
          {nodes.map((node) => (
            <div key={node.label} className="absolute left-1/2 top-1/2" style={{ transform: `translate3d(-50%,-50%,0) ${node.depth}`, transformStyle: "preserve-3d" }}>
              <NodeCard node={node} showToken />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between font-mono text-[13px] text-ink-3">
          <span className="static-motion-caption hidden">HASH BOUND · EPOCH n → n+1</span>
          <span>0xd160… topic0 · strictly newer epoch wins</span>
        </div>
      </div>
    </figure>
  );
}
