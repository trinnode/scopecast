import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";
import { TestnetBanner } from "@/components/ui";

export const metadata: Metadata = {
  title: "SCOPECAST — Revoke once. Enforce everywhere.",
  description:
    "Cross-chain agent-capability synchronisation for DeFi protocols, powered by Reactive Omni. Testnet build.",
  icons: { icon: "/brand/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0B1016",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/space-grotesk-latin-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/satoshi-latin-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <WalletProvider>
          <TestnetBanner />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
