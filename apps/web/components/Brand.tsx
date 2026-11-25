"use client";

/// SVG loaded through <img> cannot inherit CSS currentColor. Using it as a
/// CSS mask lets brand assets take the surrounding text colour directly.
export function BrandMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="SCOPECAST mark"
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        maskImage: "url('/brand/scopecast-mark.svg')",
        WebkitMaskImage: "url('/brand/scopecast-mark.svg')",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

export function BrandWordmark({ width = 160, className = "" }: { width?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="SCOPECAST"
      className={`inline-block shrink-0 ${className}`}
      style={{
        width,
        height: (width * 32) / 199.47,
        backgroundColor: "currentColor",
        maskImage: "url('/brand/scopecast-wordmark.svg')",
        WebkitMaskImage: "url('/brand/scopecast-wordmark.svg')",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "left center",
        WebkitMaskPosition: "left center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
