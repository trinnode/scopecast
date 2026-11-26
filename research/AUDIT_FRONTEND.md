# SCOPECAST — Frontend / Integration Audit

**Date:** 2026-11-26  
**Scope (read-only):** `apps/web/**` (app, components, lib, scripts, public/evidence, tailwind, globals.css, package.json) cross-checked against `contracts/src/*.sol`.  
**Method:** Static ABI/type comparison; live read-only RPC probes of the *deployed* addresses; fresh `pnpm typecheck && pnpm build` and a production server on `127.0.0.1:3200` (no server was listening on 3100) driven with Playwright at 390 / 768 / 1440 px. No commits, no secret values printed or written.

---

## Severity-ranked findings

### F-01 — HIGH — The console loads no addresses in a normal build/run: root `.env` is never read by Next
**Files:** `apps/web/lib/config.ts:51-57`, `apps/web/next.config.ts:1-11`, `README.md:238-245`. The config file lives at repo root and is read explicitly by `apps/web/scripts/flow.mjs:40-47`, but Next.js only auto-loads `.env*` from the project directory (`apps/web`). `apps/web/.env*` does not exist.

**User-visible failure (observed live on :3200):** `/console/diagnostics` shows **all five contract addresses as `NOT CONFIGURED`**; `/console` shows `AGENTS TRACKED 0`, `ACTIVE POLICIES 0`, `REVOKED KEYS 0` and “No source policies observed yet”; `/console/create` shows “PolicyHub address is not configured — signing is disabled” and the publish button is permanently disabled. The page claims “when an address is not configured … the console shows UNKNOWN rather than guessing”, but it shows zeroes and “no policies”. The five addresses that *are* in the root `.env` match `public/evidence/deployments.json` exactly (compared programmatically, values not printed), so this is pure wiring, not bad data.

**Exact fix:** In `apps/web/next.config.ts`, load the monorepo root env before config evaluation, e.g.
```ts
import { loadEnvConfig } from "@next/env";
import path from "node:path";
loadEnvConfig(path.resolve(__dirname, "../.."));
```
(the `NEXT_PUBLIC_*` values must be present at **build** time because they are inlined into the client bundle). Alternatively require/copy the public address vars into `apps/web/.env.local` and correct `README.md:238-245`, which currently implies a single `.env` works for both the script and the web app. Add a non-secret build-time assertion that the five required addresses parsed non-null.

---

### F-02 — HIGH — Log scanning uses a 200,000-block window that both configured RPCs reject, and that no longer contains the verified source events
**Files:** `apps/web/lib/chain-data.ts:29-32` (`readSourceEvents`), `:84-110` (`readVaultEvents`), catches at `:51-53` and `:108-110`.

Live RPC errors from the exact default endpoints in `lib/config.ts:59-63`:
- Base Sepolia `eth_getLogs` over 200k blocks → `exceed maximum block range: 50000` (50k succeeds).
- Unichain Sepolia over 200k blocks → `{"code":-32602,"message":"block range greater than 1000 max"}` (200 blocks succeeds, 1000 fails).
- The verified source grant is at Base block **63,543,587**; current head is **63,827,621** → **284,034 blocks old**, i.e. outside even a valid 50k window. The verified Unichain callback (block 68,778,160) is inside range but the RPC still rejects the requested span.

Every failure is swallowed and converted to `[]`, so the UI reports “no policies”/“no actions” rather than `UNKNOWN`. Worse, the catch also hides a genuine successful-but-empty result behind the same shape.

**User-visible failure:** `/console`, `/console/policies`, `/console/revoke`, `/console/demo`, `/console/policies/[agentId]` and `/console/audit` all show empty states and zero counters even though `flow.json` records a verified grant, action and revoke, and the mirror really holds epoch 2 / active=false (verified by direct read).

**Exact fix:**
1. Anchor the scan range to a known deployment/start block (from `public/evidence/deployments.json` receipts, or a `NEXT_PUBLIC_*_START_BLOCK` env var), not `head - 200_000n`; do not assume head-relative history.
2. Chunk `getLogs` into ≤50,000 blocks for Base and ≤1,000 for Unichain (with light backoff), and pass `topics: [POLICY_UPDATED_TOPIC]` / the `ActionExecuted` topic so unrelated logs are not downloaded.
3. Change the return type to a discriminated result (`{ ok: boolean; events: SourceEvent[] }` or `null`) on RPC failure, and render an explicit `UNKNOWN / RPC UNAVAILABLE` state in every consumer. Never collapse failure into an empty array.

---

### F-03 — HIGH — Propagation page labels the destination ACTIVE after a verified revoke
**Files:** `apps/web/app/console/propagation/page.tsx:11-12,49-53`; evidence `apps/web/public/evidence/flow.json:9-14`.

The page sets the route status and `StatusChip` to `DESTINATION_POLICY_ACTIVE` solely from `evidence.verified`. `flow.json` simultaneously contains a verified revoke callback (`revoke.callback`) and a `denialKind: "eth_call"`. Direct on-chain read confirms the mirror is at epoch 2 with `active=false`.

**User-visible failure (observed live):** `/console/propagation` renders the chip **`Status: ACTIVE ON DESTINATION`** and marks all three grant stages complete, while the revoke path below lists the revoke callback hash. This directly contradicts the status language rule in the build spec (`SCOPECAST_REACTIVE_OMNI_MASTER_BUILD_SPEC.md:592`) and the landing page’s claim that destination state is shown only after verified callbacks.

**Exact fix:** Derive the displayed status from the newest verified evidence stage: if `evidence.revoke?.callback` (and denial evidence) is present, use `DESTINATION_REVOKED` with revoke-path hashes in `stages`; otherwise if `evidence.grant?.callback` is present, use `DESTINATION_POLICY_ACTIVE`. Prefer a live `readMirrorPolicy(agentId)` + `deriveStatus(...)` where a source event is available. Do not treat the boolean `verified` as a current-state indicator.

---

### F-04 — MEDIUM — `mirrorAbi.PolicyMirrored` event does not match `PolicyMirror.sol`
**Files:** `apps/web/lib/contracts.ts:140-150` vs `contracts/src/PolicyMirror.sol:30-37`; correct reference ABI in `apps/web/scripts/flow.mjs:113-120`.

The Solidity event is `PolicyMirrored(bytes32 indexed agentId, uint64 indexed epoch, address indexed agent, bool active, bytes32 policyHash, address destinationModule)`. The web ABI declares `agent` as **non-indexed** and omits `destinationModule` entirely. Consequences, verified with viem:
- correct topic0 = `0x3522f38b7025f3195d38187998c574a3fc870cd43ff2f0a01343d279f2bec5e0`
- topic0 implied by the web ABI = `0x96410d36f303c1a430caa3fa27ed5e6eb552665a43ab87b1ce51a83d4262284a`
- `decodeEventLog({ abi: mirrorAbi, eventName: "PolicyMirrored" })` on a genuine log throws `AbiEventSignatureNotFoundError`.

The defect is currently latent because no UI code decodes `PolicyMirrored` (only `scripts/flow.mjs` does, with the correct ABI), but any future mirror-event read or topic filter in the console will silently fail or mis-decode.

**Exact fix:** Make `contracts.ts` match the Solidity declaration byte-for-byte: mark `agent` `indexed: true` and append `{ name: "destinationModule", type: "address", indexed: false }`. Add a unit test that compares `toEventSelector()` of every ABI event with the signature compiled from the Solidity source.

---

### F-05 — MEDIUM — Revoke status is stuck at SOURCE_REVOKED after the user submits a revoke
**Files:** `apps/web/app/console/revoke/page.tsx:32-44`, `:37`, `:103`.

The effect that refreshes `mirrorEpoch` depends only on `[selected, hash]`. It fires once when `hash` is set (usually before the source tx is even mined), then never polls. The derived status can only reach `DESTINATION_REVOKED` if `mirrorEpoch >= current.epoch + 1` on that single read; otherwise it stays `SOURCE_REVOKED` until the user changes selection or reloads.

**User-visible failure:** After a successful revoke the console permanently displays “REVOKED ON SOURCE — PROPAGATION PENDING” even when the callback has completed and the vault now rejects the agent. The page text promises it is “Waiting for the Reactive transaction and destination callback receipt”, but nothing waits.

**Exact fix:** After `waitForTransactionReceipt`, poll `readMirrorPolicy(current.agentId)` on a bounded interval (e.g. 4 s for up to 3 min); update `mirrorEpoch` each poll; stop at `DESTINATION_REVOKED` or explicitly surface `CALLBACK_FAILED` / `DESTINATION_SYNC_UNKNOWN` on timeout. Clear the interval on unmount/selection change.

---

### F-06 — MEDIUM — `pnpm flow` overwrites verified evidence with placeholder hashes that the UI renders as explorer links
**Files:** `apps/web/scripts/flow.mjs:239,242` writes `reactive: "SEE_LASNA_TX"` in both grant and revoke; `apps/web/app/console/propagation/page.tsx:58` builds `https://lasna.reactscan.net/tx/${s.hash}` for **any** truthy hash (only the stage-detail block at `:75` checks `startsWith("0x")`). The script also drops the manually-added `reactiveContract`, `reactiveTxNote` and `denialReason` fields present in the current `flow.json`.

**User-visible failure:** Re-running the documented evidence command replaces real Lasna hashes with a placeholder and produces broken `…/tx/SEE_LASNA_TX` links in the route visual, while the landing page continues to claim “Verified”.

**Exact fix:** Have `flow.mjs` actually resolve the reactive transaction hashes from Lasna `PolicyAccepted` events by `originTxHash` (as its own note at `:257` says) and write real 32-byte hashes, or write `null` and let the UI show “NO VERIFIED RECEIPT”. Validate hashes with `/^0x[0-9a-fA-F]{64}$/` before constructing URLs in `propagation/page.tsx`. Preserve all evidence fields in `FlowEvidence` (`apps/web/lib/evidence.ts:4-12`) when rewriting the file.

---

### F-07 — LOW — Two unused fonts are preloaded on every page
**Files:** `apps/web/app/layout.tsx:23-24` preload `/fonts/space-grotesk-latin-variable.woff2` and `/fonts/satoshi-latin-400.woff2`. No `@font-face` in `app/globals.css:5-31` and no Tailwind family (`tailwind.config.ts:31-35`) uses either; the real families are Unbounded, Archivo and Space Mono.

**User-visible failure / evidence:** Live browser emitted 8 warnings: “resource … was preloaded … but not used within a few seconds from the window's load event”; two unnecessary font downloads on every route.

**Exact fix:** Remove both preload tags, or replace them with preloads for `/fonts/unbounded-latin-variable.woff2` and `/fonts/archivo-latin-variable.woff2` (with `crossOrigin="anonymous"`), which are the families actually loaded.

---

### F-08 — LOW — Every policy is titled “Northstar Rebalance Agent”
**Files:** `apps/web/app/console/policies/page.tsx:46`, `apps/web/app/console/policies/[agentId]/page.tsx:39`.

**User-visible failure:** Creating a policy with any other agent name still renders that fixed title in the list and detail header; users cannot distinguish policies by label and may assume the wrong policy is being revoked. (`create/page.tsx:27` derives `agentId` from the name, so names are in fact user-controlled.)

**Exact fix:** Store/display a label derived from the event data (e.g. `truncateHex(agentId)` as the title and the agent address as subtitle), or add a real label to the source event contract; do not hardcode a demo name in generic views.

---

### F-09 — LOW — Reduced-motion preference is bypassed by carousel button scrolling
**Files:** `apps/web/components/effects.tsx:174-188`. Auto-advance correctly checks `prefers-reduced-motion` at `:185`, but `go()` calls `box.scrollTo({ ..., behavior: "smooth" })` at `:180` unconditionally. CSS `scroll-behavior: auto !important` in `globals.css:219-225` does not override an explicit JS `behavior`.

**User-visible failure:** Reduced-motion users still get animated horizontal scrolling when using the carousel controls.

**Exact fix:** Choose `behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"` inside `go()`.

---

### F-10 — LOW — Chain switch state is set optimistically and wallet errors are never cleared
**Files:** `apps/web/components/WalletProvider.tsx:88-116` and `:36,81-82,113`.

`wallet_addEthereumChain` frequently adds without switching, yet the code sets `chainId` to the target immediately (`:111`). `error` is only ever set, never cleared on a later successful switch, so the banner in `AppShell.tsx:106-108` goes stale.

**User-visible failure:** The create/revoke pages can enable “Publish policy on Base” / “Revoke across chains” while the wallet is still on the wrong chain, producing a `writeContract` chain-mismatch failure; a dismissed network problem remains visible after it is fixed.

**Exact fix:** After any switch/add request, re-read `eth_chainId` and set state from that value; rely on the `chainChanged` event as the source of truth; `setError(null)` at the start of `switchChain` and on confirmed success.

---

## Verified facts

- **Status strings:** All 11 mandated states in `SCOPECAST_REACTIVE_OMNI_MASTER_BUILD_SPEC.md:578-590` are present verbatim in `apps/web/lib/status.ts:1-13`. `STATUS_META.SOURCE_REVOKED` is labelled “REVOKED ON SOURCE — PROPAGATION PENDING” (`:23`) and is never described as revoked everywhere; `audit/page.tsx:48` uses `SOURCE_REVOKED` for source-only rows. `DESTINATION_REVOKED` is only produced by `deriveStatus` when `destEpoch === sourceEpoch` and source is inactive (`status.ts:52-53`), and by the revoke page only after a mirror-epoch check (`revoke/page.tsx:39-41`).
- **Topic0:** `POLICY_UPDATED_TOPIC` (`config.ts:85`) equals `keccak256("PolicyUpdated(bytes32,address,uint64,uint256,address,bytes4,uint256,uint64,bool,bytes32)")`, recomputed with viem: `0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9`. `readSourceEvents` filters on this topic and decodes with `eventName: "PolicyUpdated"` (`chain-data.ts:32-34`). A real log from the deployed hub decoded successfully: epoch 1, active true, selector `0xe5be9ebf`, cap `10e18`, module = deployed vault.
- **ABI parity:** `policyHubAbi`, `vaultAbi`, `getPolicy` tuple component order and `ActionExecuted` match `PolicyHub.sol:33-44,91-97,122-155,160`, `GuardedDeFiVault.sol:30-37,105,128-130` and `IScopecast.sol:7-17`. The only ABI defect found is the `PolicyMirrored` event (F-04). `scripts/flow.mjs` uses the correct mirror event ABI.
- **Selector / cap units:** `create/page.tsx:10-14` default signature `rebalance(bytes32,uint256)` yields `0xe5be9ebf`, identical to the vault’s `this.rebalance.selector` (`GuardedDeFiVault.sol:113`). `parseUnits(cap, 18)` matches `MockAsset.decimals = 18` (`MockAsset.sol:10`) and the on-chain grant cap of `10000000000000000000`.
- **Mirror / vault reads:** Direct viem reads with the exact web ABI and deployed addresses decoded correctly: mirror epoch 2, `active=false`, selector `0xe5be9ebf`, cap 10e18; vault `positions` = 48 idle / 2 strategy test units. `readMirrorPolicy` and `readVaultPositions` return `null` on failure and consumers show `UNKNOWN` — correct fail-closed behaviour.
- **Evidence wiring:** After F-01/F-02 are fixed, the landing `#status` table renders real values from `deployments.json` and `flow.json` — verified live: reactive address, hub address, mirror address, “Verified · 3000 ms”, and `AgentPolicyInactive (0x5aff86e7)`. Explorer hosts used by propagation, audit and detail pages match the defaults in `config.ts:65-69` (Base/Unichain/Lasna).
- **Local assets / no runtime fetch:** `@font-face` URLs point to existing `/fonts/*.woff2`; all three used families loaded successfully in the browser. Video (`/media/aurora-loop.webm`) and brand masks (`/brand/*.svg`) are local and requested from 127.0.0.1 only; no external runtime asset fetch observed.
- **Responsive / nav / motion (observed):** No horizontal overflow at 390 / 768 / 1440 px on `/` and `/console` (`documentElement.scrollWidth === clientWidth`). Navigation is top-only; the logo is persistent in both header and drawer; the 44×44 hamburger opens the drawer (`aria-expanded=true`, transform identity) and closes it via the close button, backdrop or Escape; drawer navigation closes on link click. Reduced motion hides the video and propagation pulses and sets `scroll-behavior:auto`. The carousel scrolls only its own container (`window.scrollY` unchanged when its next button is invoked programmatically). No console errors; the only warnings are F-07.
- **Tooling:** `pnpm typecheck` → clean (`tsc --noEmit`, no diagnostics). `pnpm build` → compiled successfully, types validated, 12 route entries generated (11 authored screens + `not-found`); `/`, `/console/architecture`, `/console/create`, `/console/demo`, `/console/revoke` static; the six RPC-driven routes dynamic. Build served on port 3200 because nothing was listening on 3100.
- **Server/client boundary:** No illegal boundary call found. `lib/evidence.ts` (`node:fs`) is imported only by server components; `lib/chain-data.ts` contains no server-only API and is safely imported by both server and client components; `useWallet()` is only called from `"use client"` pages. Components exported from `"use client"` modules are rendered as components (not invoked as functions) from server components, which is valid in Next.js App Router.

---

## Residual risks

1. **Static evidence is trusted, not revalidated.** `flow.json` hashes are rendered as “verified” without an `eth_getTransactionReceipt` check at request time. A stale or edited JSON blob would be presented as live proof. `deriveStatus` likewise infers destination state from mirror state only; it does not verify a callback receipt per policy.
2. **History window remains fragile after F-02.** Even with chunking, any policy older than the anchor block or pruned by the RPC provider will disappear. A proper indexer or server-side cache keyed to the deployment block is needed for durable audit history.
3. **Docs drift.** `docs/DEPLOYMENTS.md:9-12` and `:108-121` still say `flow.json` has `verified: false` and instruct readers to keep it false, while the file now has `verified: true`; §6 shows `<PENDING_DEPLOY>` for the callback gas limit that §3 says was verified as 800,000. This can mislead an operator into resetting valid evidence.
4. **Unverified claims.** The landing page hardcodes “51 tests passing” (`app/page.tsx:301`) and “lREACT reserve deposited, debt 0” (`:303`); neither was re-verified in this audit. The test suite and funding state should be measured by the release pipeline rather than hardcoded copy.
5. **Wallet flow not exercised end-to-end.** No injected wallet exists in the headless browser, so `writeContract` argument encoding, `wallet_switchEthereumChain` behaviour and ephemeral-key transaction submission were reviewed statically, not executed. F-10 is the concrete defect found; signing itself remains unproven in this audit.
6. **Demo key UX mismatch.** `demo/page.tsx:102,129` says the ephemeral key is “generated in your browser”, but the UI offers no generator — the user must paste a key (presumably the deployer’s `AGENT_SESSION_PRIVATE_KEY` from the runbook). This may lead users to handle a key they believe was auto-generated and discarded.
7. **RPC limits are current observations.** Base (50k) and Unichain (1k) `eth_getLogs` caps were measured on 2026-11-26 against the default public endpoints; they can change. The fix in F-02 should treat limits as configuration rather than constants.
