"use client";

import { useEffect, useRef, useState } from "react";

/// Layered animated aurora. Pure CSS gradients, no runtime fetch, no canvas.
export function AuroraWaves() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="aurora-layer aurora-one" />
      <div className="aurora-layer aurora-two" />
      <div className="aurora-layer aurora-three" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-canvas/30 to-canvas" />
    </div>
  );
}

/// Diagonal light streaks, loosely inspired by the meteors effect.
export function Meteors({ count = 14 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="meteor"
          style={{
            left: `${(i * 37 + 11) % 96}%`,
            top: `${(i * 53 + 7) % 70}%`,
            animationDelay: `${i * 1.9}s`,
            animationDuration: `${5 + (i % 4)}s`,
            opacity: 0.25 + (i % 3) * 0.15,
          }}
        />
      ))}
    </div>
  );
}

/// Small floating light points around a focal area.
export function Sparkles({ count = 18 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="sparkle"
          style={{
            left: `${(i * 29 + 13) % 94}%`,
            top: `${(i * 47 + 19) % 88}%`,
            width: i % 4 === 0 ? 3 : 2,
            height: i % 4 === 0 ? 3 : 2,
            animationDelay: `${(i % 7) * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}

/// Adds a pointer-tracked diagonal glare to any container.
export function GlareCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const apply = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    e.currentTarget.style.setProperty("--gx", `${px * 100}%`);
    e.currentTarget.style.setProperty("--gy", `${py * 100}%`);
    e.currentTarget.style.setProperty("--glare", "1");
  };
  const clear = (e: React.PointerEvent<HTMLDivElement>) =>
    e.currentTarget.style.setProperty("--glare", "0");
  return (
    <div className={`glare-card ${className}`} onPointerMove={apply} onPointerLeave={clear}>
      {children}
    </div>
  );
}

/// Subtle magnetic pull on primary buttons.
export function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      className="magnetic inline-block"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        e.currentTarget.style.setProperty("--mxp", `${dx * 0.14}px`);
        e.currentTarget.style.setProperty("--myp", `${dy * 0.2}px`);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--mxp", "0px");
        e.currentTarget.style.setProperty("--myp", "0px");
      }}
    >
      {children}
    </span>
  );
}

/// Vertical tracing beam used by timelines; draws once when revealed.
export function TracingBeam({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`tracing-beam ${visible ? "is-visible" : ""} ${className}`} aria-hidden="true">
      <span className="tracing-beam-line" />
      <span className="tracing-beam-head" />
    </div>
  );
}

/// Orbiting rings that sit behind the Reactive node in the 3D route.
export function OrbitRings() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <span className="orbit orbit-a" />
      <span className="orbit orbit-b" />
      <span className="orbit orbit-c" />
    </div>
  );
}
