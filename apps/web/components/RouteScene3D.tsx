"use client";

import { useRef } from "react";

const nodes = [
  { label: "BASE SEPOLIA", sub: "84532 · source", tone: "from-flare/25", glyph: "01", depth: "translate3d(-175px, 14px, 40px) rotateY(16deg)" },
  { label: "REACTIVE OMNI", sub: "5318007 · reaction", tone: "from-iris/25", glyph: "02", depth: "translate3d(0, -18px, 110px) rotateY(0deg)" },
  { label: "UNICHAIN SEP.", sub: "1301 · enforcement", tone: "from-blush/20", glyph: "03", depth: "translate3d(175px, 14px, 40px) rotateY(-16deg)" },
];

/// Original CSS/SVG 3D illustration of the policy route. Pointer movement
/// nudges the scene; reduced-motion users get a static, labelled view.
export function RouteScene3D() {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current?.style.setProperty("--sy", `${px * 18}deg`);
    ref.current?.style.setProperty("--sx", `${-py * 12}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--sy", "0deg");
    ref.current?.style.setProperty("--sx", "0deg");
  };

  return (
    <div
      className="relative h-[360px] w-full select-none overflow-hidden rounded-lg border border-line-strong bg-[#07070A]"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ perspective: "1200px" }}
      aria-label="Three-chain policy route illustration"
    >
      <div className="absolute inset-0 surface-grid opacity-50" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-iris/10 blur-[80px]" />
      <div className="absolute left-1/4 top-1/3 h-52 w-52 rounded-pill bg-flare/10 blur-[70px]" />

      <div
        ref={ref}
        className="scene-core absolute inset-0"
        style={{ transformStyle: "preserve-3d", transform: "rotateX(var(--sx,0deg)) rotateY(var(--sy,0deg))" }}
      >
        <div className="absolute left-1/2 top-1/2 h-px w-[420px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-flare via-iris to-blush opacity-60" />
        <div className="sc-propagation-pulse absolute left-1/2 top-1/2 h-[3px] w-14 -translate-y-1/2 animate-signal-travel rounded-pill bg-white shadow-[0_0_18px_rgba(0,240,255,.8)]" style={{ ["--signal-distance" as string]: "360px" }} />

        {nodes.map((node, i) => (
          <div
            key={node.label}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate3d(-50%,-50%,0) ${node.depth}`, transformStyle: "preserve-3d" }}
          >
            <div className={`relative h-[150px] w-[170px] rounded-lg border border-line-strong bg-gradient-to-b ${node.tone} to-[#0B0B0D]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,.55)]`}>
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-pill border border-line-strong bg-canvas font-mono text-[13px] text-ink">{node.glyph}</span>
                <span className="h-2 w-2 rounded-pill bg-current opacity-70" />
              </div>
              <p className="mt-7 font-display text-[13px] font-bold leading-5 text-ink">{node.label}</p>
              <p className="mono mt-1 text-[12px] text-ink-3">{node.sub}</p>
              <div className="absolute -bottom-3 left-6 right-6 h-5 rounded-pill bg-black/40 blur-md" />
            </div>
          </div>
        ))}

        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-pill bg-flare/70"
            style={{ transform: `translate3d(${(i - 1.5) * 110}px, ${i % 2 === 0 ? -46 : 46}px, 60px)` }}
          />
        ))}
      </div>

      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.1em] text-ink-3">
        <span>Move pointer to rotate</span>
        <span className="text-flare">policy hash bound to every stage</span>
      </div>
    </div>
  );
}
