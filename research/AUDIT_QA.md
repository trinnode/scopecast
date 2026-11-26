# SCOPECAST — integrated QA record

Date: 2026-11-26. This file records the verification performed after integrating the four
independent audit reports (`AUDIT_CONTRACTS.md`, `AUDIT_TRUTH.md`, `AUDIT_FRONTEND.md`,
`AUDIT_DOCS.md`). Commands are reproducible; no secret values are included.

## Gates

| Gate | Command | Result |
| --- | --- | --- |
| Solidity build | `cd contracts && forge build` | Compiler run successful (lint notes only) |
| Formatting | `cd contracts && forge fmt --check` | Clean (formatted before check) |
| Solidity tests | `cd contracts && forge test -vvv` | **51 passed, 0 failed**, 5 suites (unit, fuzz, replay, forged callback, local lifecycle) |
| Frontend types | `cd apps/web && pnpm typecheck` | `tsc --noEmit` clean |
| Frontend build | `cd apps/web && pnpm build` | Compiled successfully; 12 build entries (11 authored screens + `not-found`) |
| Flow script | `node --check apps/web/scripts/flow.mjs` | Syntax valid |

## Browser verification

A production build was served locally and driven with Playwright.

- `/console/diagnostics` renders the five deployed addresses (no `NOT CONFIGURED`) — confirms the
  monorepo root `.env` is loaded at build time by `next.config.ts`.
- `/console` reports **1 agent**, **1 revoked key**, `REVOKED ON DESTINATION`, vault positions
  `48 idle / 2 strategy` — confirms chunked, anchored `eth_getLogs` reads now work.
- `/console/propagation` renders `REVOKED ON DESTINATION`, labels the grant path `HISTORICAL`, and
  links only hashes matching `^0x[0-9a-fA-F]{64}$`.
- No horizontal overflow at 390 / 768 / 1440 px; no console errors.
- Hamburger opens and closes via the close button, backdrop and Escape; logo is persistent.

## Corrections applied from the audits

1. `next.config.ts` loads the repository-root `.env` at build time; addresses are no longer missing.
2. `lib/chain-data.ts` scans from verified deployment anchors in bounded chunks (Base 50k,
   Unichain 1k), returns `{ ok, events }`, and consumers show `UNKNOWN` rather than empty on RPC
   failure.
3. Propagation status derives from verified revoke evidence, not the `verified` boolean.
4. `mirrorAbi.PolicyMirrored` matches the Solidity event exactly (indexed `agent`, plus
   `destinationModule`).
5. Revoke screen polls the destination mirror after submission.
6. `scripts/deploy.sh` uses the verified 800,000 callback gas limit and the correct
   `_CALLBACK_SENDER()` getter; stale `deployed-addresses.env` removed.
7. `apps/web/scripts/flow.mjs` verifies resumed hashes, discovers real Lasna transaction hashes,
   matches callback logs by agent and epoch, and fails if the post-revoke simulation succeeds.
8. Documentation drift corrected: `opCode == 4`, implemented `configure()` bootstrap, public
   `coverDebt()`, verified funding figures, bytecode sizes in bytes, 3,000 ms revoke / 2,000 ms
   grant propagation, and removal of stale `<PENDING_*>` framing.
9. Font preloads now reference the shipped Unbounded/Archivo files; design-system authoritative
   block documents the implemented typography and palette.
10. Carousel scrolling respects reduced motion; hardcoded policy titles replaced with agent IDs.

## Residual risks

- Evidence JSON is trusted at render time; it is not re-verified by receipt on every page load.
- History depends on RPC availability and the configured anchor blocks; a durable indexer would be
  needed for long-term audit history.
- Wallet signing was reviewed statically; no injected wallet was available in the headless browser.
- No professional audit has been performed.
