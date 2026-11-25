"use client";

import { useEffect, useState } from "react";

/// Solid at rest, translucent and blurred once the page is scrolled.
export function ScrollAwareHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ease-enter ${
        scrolled ? "border-line/60 bg-canvas/70 backdrop-blur-xl" : "border-line bg-canvas"
      } ${className}`}
    >
      {children}
    </header>
  );
}
