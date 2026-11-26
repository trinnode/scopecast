# SCOPECAST — documentation / evidence consistency audit

**Auditor note.** Read-only audit of `README.md`, `docs/*.md`, `research/*.md`,
`design-system/MASTER.md`, `apps/web/public/evidence/*.json` against
`contracts/src/*.sol`, `contracts/test/*.t.sol`, `contracts/foundry.toml`,
`apps/web/**`, `.env.example`, `scripts/deploy.sh` and the sibling docs. No
commits, no secret values. Priority: **P0** = wrong technical fact / would
mislead a submission or reproduce a broken deploy; **P1** = stale address,
status or bootstrap claim that contradicts live evidence or code; **P2** =
procedural / naming / unverifiable claim; **P3** = advisory / cosmetic.

---

## Findings

| file:line | claim | problem | correction | priority |
| --- | --- | --- | --- | --- |
| `docs/ARCHITECTURE.md:21` | `PolicyHub` `emits PolicyUpdated (LOG3)` | Wrong. `PolicyUpdated` has 3 indexed params **plus** the signature = 4 topics → `LOG4`/`opCode == 4`. Contract requires `opCode == 4` (`ScopeCastReactive.sol:145-148`). | Change `LOG3` to `LOG4` (`opCode 4`). | P0 |
| `docs/ARCHITECTURE.md:90` | TB2 filter list includes `opCode == 3` | Wrong; code rejects any `opCode != 4`. | `opCode == 4`. | P0 |
| `docs/SECURITY.md:101-102` | `opCode == 3 (three indexed parameters → LOG3)` | Wrong for this event (see above). | `opCode == 4` / `LOG4`; keep "three indexed fields" but explain 3 + signature = 4. | P0 |
| `docs/THREAT_MODEL.md:17` | Spoofed-event mitigation checks `opCode == 3` | Wrong; contradicts `ScopeCastReactive.sol:148`. | `opCode == 4`. | P0 |
| `docs/CALLBACK_OPERATIONS.md:89` | "hub emits three indexed fields, so `opCode` is 3" | Wrong inference; three indexed fields + topic0 = 4. | `opCode` is 4. | P0 |
| `docs/DEPLOYMENTS.md:52-54` / `README.md:324-325` | Final callback gas limit is 800,000; 300,000 failed from proxy overhead | Correct in prose, but `scripts/deploy.sh:25` still sets `CALLBACK_GAS_LIMIT=300000`; re-running the documented deploy reproduces the failed callback. | Set deploy script to 800000 (or read from `.env`/canonical evidence) before calling it reproducible. | P0 |
| `docs/CALLBACK_OPERATIONS.md:17` | "Configured callback gas limit `<PENDING_DEPLOY>`; local harness uses `300000`" | Stale. Deployed value verified as 800000 (`DEPLOYMENTS.md:59`); 300000 was the failed attempt. | `800000` (immutable, verified), note 300000 only as the failed earlier attempt. | P0 |
| `docs/THREAT_MODEL.md:17` | "subscription is created only in the constructor and there is no runtime unsubscribe/resubscribe method, so a lost subscription requires redeployment" | Wrong. `configure()` (`ScopeCastReactive.sol:97-121`) unsubscribes the old hub and subscribes the new one at runtime. | Replace with: owner-only `configure()` can re-subscribe/re-point; monitor its owner slot. | P1 |
| `docs/CALLBACK_OPERATIONS.md:96-98` | "subscription … cannot be changed at runtime … redeploy" | Wrong; `configure()` changes it. | Use `configure()`; redeploy only for wrong *immutable* values. | P1 |
| `docs/CALLBACK_OPERATIONS.md:151-152` | "reactive contract has no runtime subscribe/unsubscribe helper; redeploy" | Wrong; `configure()` is exactly that helper. | Correct to `configure(hub, module, mirror)`; redeploy only if immutable topic0/chain/gas/proxy are wrong. | P1 |
| `docs/THREAT_MODEL.md:23` | "deploy from predicted CREATE addresses computed from verified deployer nonces" | Obsolete flow. Implemented bootstrap is owner-only `configure()` (`ARCHITECTURE.md:170-199`, `deploy.sh:95-97`); no nonce prediction. | Delete nonce-prediction language; describe `configure()`. | P1 |
| `docs/SECURITY.md:81-82` | "deployment uses predicted CREATE addresses rather than the harness shortcut (see `ARCHITECTURE.md` §6)" | Directly contradicts `ARCHITECTURE.md:174-183`, which says "Rather than predict CREATE addresses … use `configure()`". | Replace with the `configure()` bootstrap. | P1 |
| `docs/CALLBACK_OPERATIONS.md:150` | "repeating the predicted-address bootstrap in `RUNBOOK.md` §2" | `RUNBOOK.md` §2 documents `configure()`, not prediction. | Point to `RUNBOOK.md` §2 `configure()` step. | P1 |
| `docs/THREAT_MODEL.md:20` / `docs/CALLBACK_OPERATIONS.md:47-50` / `docs/RUNBOOK.md:290-291` | "`ScopeCastReactive` has **no** public `coverDebt` wrapper" | Wrong: `ScopeCastReactive.sol:128-131` exposes `coverDebt()` publicly. | State that both mirror and reactive expose public `coverDebt()`; update recovery guidance accordingly. | P1 |
| `docs/ARCHITECTURE.md:62` | Role table: `originHub` an immutable; mutation surface lists `setDestinationMirror` only | `originHub` and `expectedDestinationModule` are mutable via `configure()`; table omits `configure()` entirely. | Mark hub/module/mirror as owner-set via `configure()`; list `configure`, `setDestinationMirror`, `transferOwnership`. | P1 |
| `docs/ARCHITECTURE.md:95` | TB7 monitors only `setDestinationMirror` | `configure()` also rewrites `originHub`, `expectedDestinationModule` and `destinationMirror` and re-subscribes. | Monitor/protect the reactive owner and all three config slots. | P2 |
| `docs/DEPLOYMENTS.md:9-12` | "console currently reads `flow.json` with `verified: false` … shows `UNKNOWN` / `DESTINATION_SYNC_UNKNOWN`" | Stale: `flow.json:2` is `verified: true` with full hashes; landing page renders verified values. | Remove/reframe as "before evidence was recorded"; console now shows verified flow. | P1 |
| `docs/DEPLOYMENTS.md:102-106` | Funding table all `<PENDING_DEPLOY>`, incl. "callback gas limit in deployment" | Contradicts §3 of the same file (gas 800000, mirror balance 0.0001 ETH, reactive `debt()=0`) and `deployments.json` deposit/faucet tx. | Fill from RPC or link to `deployments.json`; gas limit = 800000. | P1 |
| `docs/DEPLOYMENTS.md:110-121` | "keep `verified: false` until … exists" | The three-chain receipt set now exists; instruction would revert a correct evidence state. | Replace with maintenance rule: flip only from new verified receipts; current state is `true`. | P1 |
| `docs/ARCHITECTURE.md:3-6` | "No production deployment receipts exist yet. Every address/hash … `<PENDING_DEPLOY>`" | Stale: verified testnet receipts recorded in `DEPLOYMENTS.md` §2-5 and `deployments.json`. | Say "all verified testnet addresses/hashes are in `DEPLOYMENTS.md`; `<PENDING>` only for unknown funding reads". | P1 |
| `docs/ARCHITECTURE.md:61-64` | Component table still uses `<PENDING_DEPLOY>` for vault/module/mirror/reactive sender | Stale; final values are in `DEPLOYMENTS.md:56-62` / `.env` / `config.ts`. | Replace placeholders with final values or a single link to the canonical JSON. | P1 |
| `docs/THREAT_MODEL.md:4-5` | "No deployed addresses or hashes exist yet" | Stale; contradicted by `DEPLOYMENTS.md` and both evidence JSONs. | Point to verified deployments. | P1 |
| `docs/THREAT_MODEL.md:21` | "`flow.json` starts with `verified: false`" | Stale; current file is `true`. | Reword as historical fallback. | P2 |
| `docs/THREAT_MODEL.md:50` / `docs/SECURITY.md:160-167` | "until then app reports `UNKNOWN` / `SIMULATION`" | Stale given verified evidence. | Reword as fallback behaviour for missing/unverifiable values. | P2 |
| `docs/SECURITY.md:108-109` | "local harness uses 300,000. The deployed value must be recorded from verified receipt" | Stale framing; deployed value already recorded as 800000. | Keep 300000 only as historical failed-attempt note; state 800000 deployed. | P2 |
| `docs/CALLBACK_OPERATIONS.md:3-5`, `:166-168` | All values `<PENDING_DEPLOY>` / "never mark complete until … verified" | Stale preamble and stale "until then UI shows UNKNOWN". | Update to reflect verified evidence; keep the rule for *future* additions. | P2 |
| `docs/RUNBOOK.md:3-6`, `:303-304` | "Until then addresses `<PENDING_DEPLOY>` … update `flow.json` only after verified; otherwise console remains `verified: false`" | Stale; evidence is verified and flag is `true`. | Reword as maintenance instruction, not current state. | P2 |
| `docs/SUBMISSION.md:7-9` | "All on-chain values below stay `<PENDING_DEPLOY>` / `<PENDING_TX>` until confirmed" | §2 is fully populated with verified values; preamble is self-contradictory. | Change to "All values below are copied from verified receipts in `DEPLOYMENTS.md`". | P2 |
| `docs/DEMO_SCRIPT.md:86` | "This rejection is a **real reverted transaction**, so there is no ambiguity" | Contradicts live evidence: `flow.json:13-14` has `denial: null`, `denialKind: "eth_call"`; `README.md:215` and `DEPLOYMENTS.md:93` label it simulation. | Narrate as `eth_call` **SIMULATION** (revert selector `0x5aff86e7`); reserve "reverted transaction" for a real receipt. | P1 |
| `README.md:102`, `:340-341` | "Full rules live in `design-system/MASTER.md`" / "font licences are listed in `design-system/MASTER.md`" | MASTER documents a different, unimplemented system (Space Grotesk / Satoshi / JetBrains Mono, `#0B1016` palette, 10 fictional screens). Implemented CSS uses Unbounded / Archivo / Space Mono, `#050506` canvas; README's own licence table is the only correct one. | Point licence/rule links to `apps/web/app/globals.css` + `tailwind.config.ts`; regenerate or archive MASTER.md as historical. | P1 |
| `research/DESIGN_SOURCES.md:69-74`, `:78-107` | Chosen fonts are Space Grotesk / Satoshi / JetBrains Mono with specific OFL/ITF licences and #F86B4F vermilion | Not what shipped. `globals.css:5-32` and `tailwind.config.ts:31-35` use Unbounded/Archivo/Space Mono; accents `#00F0FF`, `#8B5CF6`, `#FF3D81`, `#FFC53D`. | Mark this file as a superseded design exploration; add a sourcing record for the shipped fonts (licences: Unbounded/Archivo/Space Mono are OFL 1.1, as README states). | P1 |
| `design-system/MASTER.md:33-45`, `:97-100`, `:294-320` | Normative fonts, colour tokens and 10 named screens | Stale vs implemented tokens and routes (`Overview/Architecture/Audit/Create/Demo/Diagnostics/Policies/Policy detail/Propagation/Revoke`). Also preloads in `layout.tsx:23-24` still reference Space Grotesk/Satoshi and `themeColor` is `#0B1016` (old palette). | Regenerate MASTER from current CSS/tailwind and remove stale preloads/themeColor. | P1 |
| `README.md:127` | "Animated properties are limited to `transform` and `opacity`" | False: `.gradient-text` and `.skeleton` animate `background-position` (`globals.css:84`, `:216`, `tailwind.config.ts:57-60`). | Qualify as "transform/opacity for layout-affecting motion; background-position only for shimmer", or remove the claim. | P2 |
| `README.md:310` | "`pnpm build` … Pass; 12 routes" | Only 11 authored `page.tsx` routes exist; 12 is plausible only if Next's auto `/_not-found` is counted. No stored build log. | Say "11 authored routes (+ auto `/_not-found`)" or attach the build output. | P2 |
| `README.md:311` | "Browser QA 390/768/1440 px, zero horizontal overflow, no console errors" | No QA evidence file; archived `.playwright-mcp/*.log` contain `ReferenceError: Link is not defined`, HTTP 500 and font-preload warnings (historical dev runs). | Attach a clean final-run QA record or soften to "manually checked". | P2 |
| `README.md:308-309` | `forge build`, `forge fmt --check`, `pnpm typecheck` "Pass" | No stored logs; 51 test functions do exist. | Keep, but store CI/build logs as evidence. | P3 |
| `README.md:66-76` | Mermaid diagram | **No issue**: all edge labels are quoted (`|"rebalance(bytes32,uint256)"|` etc.); parentheses appear only inside quotes, so the graph is valid Mermaid. `ARCHITECTURE.md:16-50`, `:101-109`, `:118-128` likewise quote labels. | No change. | — |
| `docs/RUNBOOK.md:10-16` | Public vars `$BASE_RPC_URL`, `$UNICHAIN_RPC_URL`, `$BASE_EXPLORER_URL` … "names match `.env.example`" | `.env.example` uses `NEXT_PUBLIC_BASE_RPC_URL`, `NEXT_PUBLIC_BASE_EXPLORER_URL`, etc. `config.ts:59-69` reads the `NEXT_PUBLIC_*` names. | Use the exact `.env.example` names or state these are shell aliases. | P2 |
| `README.md:245-247` | `AGENT_SESSION_PRIVATE_KEY` is a server-only name and "see `.env.example` for the complete list" | `.env.example` does **not** contain `AGENT_SESSION_PRIVATE_KEY` (only `.env` and `flow.mjs:63` use it). | Add the variable name (blank) to `.env.example` or fix README. | P2 |
| `docs/RUNBOOK.md:25-28` | Deployer addresses and `*_NONCE` / `PREDICTED_*_ADDRESS` variables | Belong to the obsolete nonce-prediction flow; no doc step uses them. | Remove from runbook. | P2 |
| `docs/RUNBOOK.md:100-101` | Script "captures every address from `forge create --json`" and writes `deployed-addresses.env` | Script parses plain `forge create` output with `awk` (`deploy.sh:34-38`); the committed `contracts/deployed-addresses.env` contains **different, stale addresses** (reactive equals vault) from an earlier attempt. This is the most dangerous address drift in the repo. | Regenerate/delete the stale file; treat `.env` + `deployments.json` as canonical. | P1 |
| `docs/ARCHITECTURE.md:185`, `:197` / `docs/RUNBOOK.md:85` | "script performs steps 1–8" / "performs the whole sequence automatically" | `deploy.sh` deploys and configures (steps 1–6) but does **not** fund the reactive/mirror reserves (step 7) or do the full verification (step 8). | Say "steps 1–6 plus chain-ID and view checks; funding is manual". | P2 |
| `docs/RUNBOOK.md:129-130` | Instructs `setDestinationMirror(address)` after §2 `configure()` | Redundant: `configure()` already set `destinationMirror` and subscribed; calling the setter later is a separate owner action that can desynchronise mirror from the hub. | Remove or mark as emergency-only with re-verification. | P2 |
| `docs/DEMO_SCRIPT.md:1-3` | 165 s runtime, timestamps | **No issue**: segments sum to 165 s; `PolicyMirrored(bytes32,uint64,address,bool,bytes32,address)` in the fallback matches `PolicyMirror.sol:30-37`. | No change. | — |
| `README.md:204-215`, `DEPLOYMENTS.md:86-93`, `SUBMISSION.md:85-92`, `flow.json:4-16` | All grant/reactive/callback/action/revoke hashes | **No issue**: identical across all four sources. | No change. | — |
| `README.md:217-219`, `DEPLOYMENTS.md:95-96`, `SUBMISSION.md:93`, `flow.json:17` | 3,000 ms propagation from receipt timestamps | **No issue**: consistent; `flow.mjs:248` computes `revokeCallback.timestamp - revokeSource.timestamp`. | No change. | — |
| `README.md:215`, `DEPLOYMENTS.md:93`, `SUBMISSION.md:92`, `flow.json:19` | Post-revoke denial `eth_call`, revert selector `0x5aff86e7` | **No issue**: `cast sig "AgentPolicyInactive()"` = `0x5aff86e7`; all sources label it a simulation. | No change (only `DEMO_SCRIPT.md:86` needs fixing). | — |
| `README.md:92-93`, `config.ts:86`, `DEPLOYMENTS.md:32`, `flow.json` topic0 | `PolicyUpdated` topic0 | **No issue**: `cast sig-event` reproduces `0xd1601cdc…d8c9`; config and docs agree. | No change. | — |
| `README.md:190`, `DEPLOYMENTS.md:33` | `reactive-lib-omni` v0.1.0 @ `3ade0dcf…` | **No issue**: matches `VENDORED.md`, `SOURCES_REACTIVE.md:52`, and research. | No change. | — |
| `README.md:308` | "51 tests passing" | **No issue**: 51 `function test*` functions across the 5 test files (13+1+14+12+11). | No change. | — |
| `README.md:104-111`, `:132-139`, `:145-149` | Fonts, brand and screenshot paths | **No issue**: all listed woff2/SVG/PNG files exist; the two `brand/` copies are byte-identical; `config.ts` uses the same proxy/system addresses. | No change. | — |
| `README.md:5`, `MASTER.md:5`, `layout.tsx:7` | Tagline "Revoke once. Enforce everywhere." | Borderline, not a status label: it is scoped by explicit negations at `README.md:49,175,318` and `status.ts:23` ("REVOKED ON SOURCE — PROPAGATION PENDING"). Acceptable as brand copy; do not reuse as a status string. | Keep, but never render as a status or "revoked everywhere" wording. | P3 |

---

## Single source of truth (recommended)

1. **Machine-readable canonical records** — `apps/web/public/evidence/deployments.json`
   for addresses, deploy/faucet/deposit tx, library commit and `verifiedAt`;
   `apps/web/public/evidence/flow.json` for flow hashes, `propagationMs`,
   `denialKind` and `measuredAt`. Extend `deployments.json` with the remaining
   verified fields currently duplicated in prose (subscription tx, callback gas
   limit, topic0, proxy/system addresses, compiler/EVM, explorer URLs).
2. **One narrative doc** — `docs/DEPLOYMENTS.md` becomes the only human page that
   prints receipts; all other docs and README link to it instead of pasting
   addresses/hashes. Delete or regenerate `contracts/deployed-addresses.env`
   (currently stale) so only `.env` / `config.ts` / the JSONs carry addresses.
3. **One code-fact source** — `contracts/src/*.sol` for `opCode`, gas limit and
   bootstrap; `apps/web/lib/status.ts` for status labels; `globals.css` +
   `tailwind.config.ts` for fonts/colour. When code changes, these are edited
   first, then evidence, then prose.
4. **Enforce it** — add a small CI/pre-submit script that parses the two JSONs,
   `.env.example` and `config.ts` and fails on any mismatch with tables in
   README/`docs/*.md` (including the stale `300000`/`opCode 3` strings). A doc
   that cannot be generated from the JSON should be marked historical.
5. **Historical files** — `research/DESIGN_SOURCES.md`, `design-system/MASTER.md`
   and the master build spec are research/ideation, not normative; label them
   "superseded by implementation" so future readers stop treating their fonts,
   nonce-prediction flow or gas numbers as current.
