"use client";

import { useEffect, useRef, useState } from "react";

/// Locally generated looping motion (no runtime fetch). Hidden under reduced motion.
export function BackgroundMotion() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <video
        className="sc-motion absolute inset-0 h-full w-full object-cover opacity-[0.28] blur-[26px] saturate-[0.85]"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/media/aurora-loop.webm" type="video/webm" />
        <source src="/media/aurora-loop.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/80 via-canvas/60 to-canvas" />
      <div className="absolute inset-0 surface-grid opacity-40" />
      <Beams />
      <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-pill bg-flare/10 blur-[120px]" />
      <div className="absolute -right-40 top-0 h-96 w-96 rounded-pill bg-iris/10 blur-[120px]" />
    </div>
  );
}

export function Beams() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {[8, 26, 45, 63, 82].map((left, i) => (
        <span
          key={left}
          className="beam animate-beam-drift"
          style={{ left: `${left}%`, animationDelay: `${i * 1.7}s`, animationDuration: `${9 + i}s` }}
        />
      ))}
    </div>
  );
}

function pointerVars(e: React.PointerEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  return { px, py };
}

export function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`spotlight-card ${className}`}
      onPointerMove={(e) => {
        const { px, py } = pointerVars(e);
        e.currentTarget.style.setProperty("--mx", `${px * 100}%`);
        e.currentTarget.style.setProperty("--my", `${py * 100}%`);
        e.currentTarget.style.setProperty("--spot-opacity", "1");
      }}
      onPointerLeave={(e) => e.currentTarget.style.setProperty("--spot-opacity", "0")}
    >
      {children}
    </div>
  );
}

export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`tilt-card ${className}`}
      onPointerMove={(e) => {
        const { px, py } = pointerVars(e);
        e.currentTarget.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
        e.currentTarget.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--ry", "0deg");
        e.currentTarget.style.setProperty("--rx", "0deg");
      }}
    >
      {children}
    </div>
  );
}

/// Slim scroll-progress rail with the product gradient.
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-white/5" aria-hidden="true">
      <div
        className="h-full bg-gradient-to-r from-flare via-iris to-blush transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/// Intersection-observer reveal. Reduced-motion users see everything immediately.
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-enter ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`gradient-text ${className}`}>{children}</span>;
}

export function RevealText({ text, className = "" }: { text: string; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(Math.min(i, text.length));
      if (i >= text.length) window.clearInterval(id);
    }, 12);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <span className={className}>
      {text.slice(0, shown)}
      {shown < text.length && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-flare" />}
    </span>
  );
}
