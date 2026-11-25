# SCOPECAST — Competitive Landscape (dated 2026-11-25)

Scope: current Reactive Omni Buildathon entries, adjacent market products, and a targeted search for an exact clone of the SCOPECAST primitive. All claims below are sourced in `research/SOURCES.md`. Testnet-only; no mainnet funds.

**SCOPECAST thesis under test:** one authoritative, versioned per-agent/per-target/per-method capability policy on Base Sepolia (`PolicyHub`); a Reactive contract mirrors the policy event into `PolicyMirror` on Unichain Sepolia; `GuardedDeFiVault` enforces it. Destination accepts only strictly newer epochs, so a late callback cannot resurrect a revoked capability. Revocation is asynchronous — no claim of atomic or instant revocation, no claim of universality over unintegrated contracts.

---

## 0. Method and honest limitations

- **DoraHacks was behind AWS WAF "Human Verification"** for direct `curl`, and `webfetch` timed out. The build list was retrieved instead through the text-extraction proxy `r.jina.ai`, which returned the page shell (showing **167 builds / 390 hackers / 10 days left**, deadline 2026-12-05 20:00 UTC) and the **18 most recent build cards** before truncating. Pagination (`?page=2`) returned no further cards (client-side rendering). Therefore: **the full 167-entry list was not enumerable from this environment.** The 18 retrieved entries are listed in §1; the user-supplied 25 Nov 2026 snapshot of adjacent entries is treated as the adjacent set and cross-checked against those 18 (all 18 match).
- **The official announcement was retrieved in full** from blog.reactive.network (§1.1). The DoraHacks `/detail` page was also retrieved and matches it.
- **Public repositories were fetched and read**, not just read from descriptions: Pitstop (`0xvikram/pitstop`), Pocket Money (`DrVelvetFog/pocket-money`), Ration (`ace-coderr/ration`), AgentRiskGuard (`Night-Etrenal/agent-risk-guard`). Others were assessed from their build descriptions and READMEs.
- **`websearch` was unavailable (HTTP 402)**; search was done with `curl` against GitHub's REST API and the Jina proxy. GitHub code search tokenises heavily and produced no exact-clone hit; see §4.
- **MDPI full text was inaccessible (403)**; the paper's claims are limited to Crossref metadata + abstract, which were retrievable.
- No repository was copy-pasted or judged from marketing copy alone where source was obtainable.

---

## 1. Current build list

### 1.1 Official announcement and rules

"Reactive Omni Buildathon: Thirty Days to Find Out What One Second Buys", published **2026-11-04**, says the buildathon runs **5 Nov – 5 Dec 2026**, $5,500 in prizes in REACT, three tracks: **Every Second Counts** (Unichain Sepolia and/or Base Sepolia, Lasna in the middle), **Set It and Forget It**, **Reactive Meets AI**. Judging: execution, integration, usefulness, craft (equally weighted); entries without an actual reactive transaction and callback "aren't scored further". Submissions require public repo, deployed addresses, tx hashes showing the full origin-event→callback loop, and a <3-minute video. Ground rules: everything built during the event; prior work may be a dependency but not the submission; on Base Sepolia use timestamps (200 ms blocks). It confirms Omni = CometBFT, ~1 s blocks, instant finality, live on mainnet since 28 Oct 2026.

### 1.2 Live build list (18 most recent retrievable, 2026-11-25)

| Build ID | Name | Track | One-line focus (as published) |
|---|---|---|---|
| 51852 | AutoSave — Reactive Savings Sweep | Set It and Forget It | Sweeps 10% of each savings deposit via Lasna callback; ~14 s loop |
| 51849 | Lifeline | Set It and Forget It | Gas guardian: pays debt of stopped reactive/callback contract, refills inside a budget |
| 51847 | Sweep Vault | Set It and Forget It | Auto-sweep above a cap to cold wallet |
| 51842 | Reactive AI Triage | Reactive Meets AI | Escrow judged by AI, settled by Reactive callbacks |
| 51839 | PayWatch | Set It and Forget It | On-chain ERC-20 receipts / invoice settlement |
| 51836 | Noether | Every Second Counts | Hyperlane bridge conservation law; forged mint freezes every chain in ~2 s |
| 51833 | Notice Period | Set It and Forget It | Deposit leaves a vault before an unaccepted curator change takes effect |
| 51831 | MeterSift | Reactive Meets AI | AI screening of community-energy meter settlements |
| 51821 | Nervo | Every Second Counts | Cross-chain price-gap trade + Unichain stop-loss in under 2 s |
| 51826 | Triage | Every Second Counts | Reactive clerk scores ERC-20 approvals; AI policy agent escalates unlimited approvals |
| 51802 | Tripwire | Every Second Counts | Keeper-less SL/TP on Uniswap V3, Base + Unichain Sepolia, ~2.00 s |
| 51791 | AI Risk Sentinel | Reactive Meets AI | Uniswap V3 swaps → AI oracle → signed hold/pause/exit for a guardian vault |
| 51790 | Sentinel — AI-Judged On-Chain Risk Defence | Reactive Meets AI | Risk model → Lasna callback → deposits close / funds move to safety |
| 51789 | OmniGuard AI V2 | Every Second Counts | Security-hardened reactive risk sentinel + live judge workbench |
| 51786 | Reactive Sentinel Vault | Every Second Counts | Price-breach callback exits position to stable |
| 51779 | Pitstop | Set It and Forget It | Gas refills itself on every chain; locks every reserve if a key leaks |
| 51772 | Delivery Court | Reactive Meets AI | x402 USDC escrow; model judges response; Reactive pays/refunds |
| 51760 | RIFT | Every Second Counts | Bridge-failure cover paying in seconds |

The user's 25 Nov snapshot additionally lists **AI Circuit Breaker, Rhenium, VoteMirror, Reactive Limit Order, FlashExit, Autopilot Allowance, AjoFlow, Reactive Sentinel Vault, Triage/Reactive AI Triage, MeterSift** etc. Those were not in the retrievable window; their category placement below uses the snapshot plus public repo descriptions where found.

**Observation:** the delivered and described builds cluster in trading automation, stop-loss, vault risk/market pauses, savings/sweeps/gas, AI scoring and bridge protection. None of the 18 retrievable descriptions claims a versioned per-agent capability policy mirrored between EVM chains.

---

## 2. Closest buildathon entries — source-level inspection

### 2.1 Pitstop (closest *described* adjacency) — `0xvikram/pitstop`, branch `build`

Read: `src/Pitstop.sol`, `src/GasTank.sol`, DoraHacks build 51779.

- **Chain pattern:** reactive contract on Lasna; one `GasTank` per user on Base Sepolia and Unichain Sepolia; up to 6 tanks registered (`addTank(chainId, tank)`), subscribing to each tank's `Refueled` topic.
- **Mechanism:** Reactive Cron tick → `service()` callback to every tank → each tank tops up wallets below a configured gas floor, funded by a `feeReserve`. `Pitstop._onRefuel()` keeps `refuelsOn[wallet][day]` **across all chains**; if the count exceeds `maxRefuelsPerDay`, it emits `DrainSuspected` and sends `freeze()` to **every** registered tank in the same round. The callback is authenticated twice — `onlyServiceProvider` (callback proxy) and `onlyCallbackSender(sender_)` (injected reactive address) — matching the Reactive docs. Owner-only `unfreeze()` is **local per tank**, not propagated.
- **Proof (23 Nov 2026):** both tanks froze 1–2 s after the alarm; 12 Foundry tests including forged-callback rejection and worst-case gas.
- **Does it implement per-agent policy mirroring / epoch semantics? NO.** There is no `agentId`, no target address, no function selector, no per-method cap, no expiry, no active/revoked policy object. `GasTank.frozen` is a single boolean; there is no version counter and no "newer wins" rule. The trigger is a *heuristic* (cross-chain refill rate), not an owner-authored policy event. Unfreeze is a local owner action rather than a mirrored state transition.
- **Exact differentiator from Pitstop:** Pitstop detects a leaked key by **how often gas is refilled across chains** and freezes gas reserves everywhere; SCOPECAST mirrors an **owner-authored, monotonically versioned capability tuple** (agent / target / selector / value cap / expiry / epoch / active) into integrated destination guards, where a strictly newer epoch always wins and a stale callback cannot re-enable a revoked method. Pitstop cannot narrow one method or one target, cannot express "revoke X but keep Y", and gives no ordering guarantee for a late callback. SCOPECAST is not a gas product, not a drain heuristic, and not a freeze-everything switch.

### 2.2 Pocket Money — `DrVelvetFog/pocket-money` (**closest implementation found**)

Read: `README.md`, `src/PocketMoney.sol`, `src/Vault.sol`, `src/SpendLimitRegistry.sol`, `docs/x402-spend-limit-extension.md`.

- **Chain pattern:** guard contract on Reactive Lasna; `Vault` per EVM chain (Base Sepolia, Unichain Sepolia, Ethereum Sepolia); `SpendInbox` on Base for non-EVM (Sui/Solana) attested spends; `SpendLimitRegistry` per chain maps agent → vault/controller.
- **Mechanism:** the guard books every agent payment across chains into one daily allowance + shared household ceiling, chains a receipt hash, then pushes a **versioned budget mirror** to every vault with `syncBudget(...)`; `PocketMoney._sync()` emits `Synced(agent, version, agentLeft, householdLeft)`. In `Vault.sol`: `function syncBudget(address guard_, address agent, Mirror calldata m, uint64 version) external onlyGuard(guard_) { if (version <= syncVersion) return; ... }`. Destination `Vault.canSpend(agent, amount)` / `spendLeft()` is a **pre-settlement view check** used by x402 facilitators; `freezeAgent()` / `freeze()` are guard-only callbacks; `unfreeze`/`unfreezeAgent`/`setFloat` are owner-only. Trigger for freeze: unapproved payee or panic on any chain.
- **Does it implement per-agent policy mirroring / epoch semantics? PARTIALLY — this is the strongest overlap found.** It genuinely implements a **monotone versioned per-agent state mirror** (`version <= syncVersion` reject), cross-chain push by Reactive, and a destination-enforcing contract. But the mirrored state is a **remaining-budget scalar** (`allowance`, `extra`, `spent`, `dayEnds`, household totals), not a capability policy: no target contract, no function selector, no per-method cap/expiry, no `active/revoked` policy object, and no policy hash. The **source of truth is the Reactive guard's own computed spend ledger**, not a versioned registry on a source EVM chain whose `PolicyUpdated` event is mirrored. Revocation is a heuristic/local-owner freeze, not an owner-authored policy epoch from a single source chain. Enforcement is a facilitator *view call* before x402 settlement (plus local float caps and guard-only top-ups), not a general DeFi action guard that reverts with a policy error.
- **Verdict:** NOT an exact clone of SCOPECAST, but a real, live implementation of the same architectural shape (versioned per-agent cross-chain state + destination enforcement + Reactive callback path). Any novelty claim must be phrased at the level of *capability policy* (target/selector/method, epoch-driven owner revoke, source-registry→mirror→general DeFi vault), not at the level of "versioned cross-chain state mirror".

### 2.3 Ration — `ace-coderr/ration` (**closest on epoch semantics**)

Read: `README.md`, `docs/ARCHITECTURE.md`, `src/RationHub.sol`, `src/RationVault.sol`, `test/EpochChange.t.sol`.

- **Chain pattern:** `RationHub` on Reactive Lasna; `RationVault` on Base Sepolia and Unichain Sepolia; mock USDC; 112 tests including stateful invariant fuzz.
- **Mechanism:** one budget per period ("epoch"); each vault holds a *slice*. Rebalancing is a two-phase handoff — donor `release(amount, transferId, epochId)` first, recipient `grant(actual, transferId, epochId)` second — with `releaseSeen`/`grantApplied` replay maps and `seq`. `RationHub._beginEpoch()` does `epochId += 1`; new slices get `startDelay` so old and new leases never overlap, and late messages are void. `RationVault.resetEpoch(...)` starts with `if (epochId_ <= epochId) return;` — a monotone epoch guard. `spend()` enforces spender allowlist, token allowlist, optional recipient allowlist, `epochStart`/`epochEnd`, slice, and per-epoch spender cap; `closeEpoch()` stops spending immediately.
- **Does it implement per-agent policy mirroring / epoch semantics? PARTIALLY — epoch ordering yes, capability policy no.** Epoch here is a **budget period** driven by time/owner rollover, not a policy version emitted by an authoring registry. The mirrored payload is a slice/budget, not (agentId, target, selector, cap, expiry, active). Critically, `SpenderSet(spender, allowed, cap)` is a **local owner-only vault setter**, not a mirrored policy event — the owner must revoke a spender on each chain separately (the opposite of SCOPECAST's "revoke once, enforce everywhere"). There is no per-method/selector authorization at all.
- **Verdict:** not a clone, but clear in-buildathon prior art for ordered epochs + strictly-newer-wins + destination enforcement via Reactive callbacks. SCOPECAST's honest claim is *what is ordered* (a capability policy, not a budget slice) and *where it comes from* (a source-chain registry event), plus per-method enforcement.

### 2.4 Other adjacent entries (assessed from README/description, not full source)

| Entry | Mechanism | Mirrors versioned capability policy? | Destination enforces? |
|---|---|---|---|
| `Night-Etrenal/agent-risk-guard` (source read) | `AIRiskOracle.RiskFlagged` on an origin chain → `AgentGuardReactive` on Lasna → `AgentVault.freeze()` on the **same** origin chain; `AgentVault` has local `agent`, `maxPerTx`, `paused`, owner `setAgent` | No | Yes, but a freeze boolean + local cap on one chain |
| `matrixneoaiagent/reactive-omni-sentinel` | "on-chain verified inference + reactive policy callbacks"; on-chain model in `SentinelModel.sol` + `SentinelVault.sol` | "policy callbacks" in description; no per-agent/target/selector policy object found in the repo layout | Vault defends on risk signal |
| `manderson240/reactive-omni-agent` (README read) | `OriginRiskEmitter` → `ReactiveRiskSentinel` with monotonic `callbackNonce` + cooldown → `DestinationLiquidatorGuard` with replay protection; AI triage off-chain | No — nonce is for callback replay, not a policy version | Yes, defensive liquidation guard |
| `chainwright/pursestrings` (README read) | One daily allowance across agent wallets on Base/Unichain coordinated from Lasna; one STOP freezes all chains | No version/epoch in description; allowance + STOP | Vault/wallet caps |
| AI Risk Sentinel (51791), Sentinel (51790), OmniGuard AI V2 (51789), `jpmax2027/sentinel-guardian-vault`, `halfabillion/aegis-reactive` | AI/score signal → pause, exit or move to safety | No | Vault pause/exit only |
| AI Circuit Breaker, Tripwire, Nervo, FlashExit, Reactive Sentinel Vault, stop-loss repos | Market/price event → SL/TP or contract pause | No | Trade execution / pause |
| Notice Period (51833) | Curator change scheduled → user's deposit exits before change | No | Exit-to-self, not policy enforcement |
| Noether (51836), RIFT (51760), `0xward/contagion-stop` | Bridge conservation / bridge-failure cover / cross-chain circuit breaker | No | Freeze or payout |
| Lifeline (51849), Sweep Vault, AutoSave, Autopilot Allowance, AjoFlow | Gas top-up, sweeps, savings, recurring transfers | No | Balance movement |
| Triage (51826), Reactive AI Triage (51842), `mokshupadhyay/chainguard`, Delivery Court (51772) | Approval/payment scoring, auto-revoke dangerous approvals, AI escrow | No | Approval revocation / escrow settlement |

`mokshupadhyay/chainguard` is described as "auto-revokes dangerous token approvals with a Reactive Network contract" — that is **approval revocation**, not agent capability policy mirroring, and it has no source files in its default branch at the time of checking.

---

## 3. Adjacent industry products and prior work

### 3.1 Alchemy Agent Wallets — session permission model
URL: https://www.alchemy.com/overviews/agent-wallets-session-permission-model (accessed 2026-11-25; page dated 2026-09-02, modified 2026-10-29).

- **Supports:** CLI sessions with a capability list (send, swap, bridge, contract calls), expiry, per-request `--max-payment`; instant revoke at Alchemy's **backend verification layer** with no transaction. Wallet APIs session keys on EIP-7702 smart accounts add per-token/cumulative caps, gas limits, `contract-access`, `functions-on-contract` (function selectors), `expirySec`. Verification before each irreversible action (`wallet status --verify`).
- **Does not support:** a single on-chain source registry whose policy updates are actively mirrored by a cross-chain protocol into each integrated destination contract; monotone epoch ordering across chains; a verifiable on-chain callback path. Removing a Wallet API session key is an **onchain uninstall requiring a mined user operation**; Alchemy's own guidance warns against relying on onchain permission changes as an instant kill switch. SCOPECAST likewise does not claim instant/atomic revocation and states the asynchronous window explicitly.
- **Relevance:** proves scoped, revocable agent permissions are an established product category; it does not anticipate SCOPECAST's cross-chain mirror wedge.

### 3.2 MetaMask Advanced Permissions
URL: https://metamask.com/news/introducing-advanced-permissions (accessed 2026-11-25; published 2026-04-06, modified 2026-11-23). Docs: https://docs.metamask.io/smart-accounts-kit/concepts/advanced-permissions.

- **Supports:** ERC-7715 `wallet_requestExecutionPermissions`; human-readable, user-adjustable scopes; session account executing via ERC-7710 delegation; onchain caveat enforcers; periodic/streaming/revocation permission types; `startTime`/`expiry`; user revocation from MetaMask; post-execution hooks and sub-delegation; any EIP-7702 chain (Base and Unichain listed).
- **Does not support:** cross-chain propagation of one permission grant to other chains via an event→callback protocol; a global policy epoch; a shared source registry consumed by multiple destination guards. Permissions are user-signed per wallet; there is no relay of a policy state change between chains.
- **Relevance:** the strongest "scoped agent capability" baseline; SCOPECAST's wedge is not scoping itself but **ordered cross-chain synchronisation of scoped state with destination enforcement and a visible callback trail**.

### 3.3 Signo — limited spending rights for AI agents
URL: https://docs.signo.fi/guides/limited-spending-rights-for-ai-agents (accessed 2026-11-25; page says last verified 2026-10-16, Execute in early access). Code: https://github.com/FlipLabsAI/signo-shield.

- **Supports:** one action, one token, per-firing limit, lifetime limit, expiry, exact venue contracts, chain-readable trigger and required result; enforced by the Signo Shield contract on **X Layer and Arbitrum** at every firing; revocation signed by the wallet onchain, effective when included in a block, with already-included firings still executing.
- **Does not support:** cross-chain mirroring of one permission to other chains; epoch ordering; arbitrary method/target policies across DeFi protocols; a Reactive-style subscription/callback path.
- **Relevance:** very close in *policy tuple* semantics (action/token/limits/expiry/venues) but explicitly single-chain-per-Shield and owner-revoked locally.

### 3.4 Chainlink — cross-chain identity
URL: https://chain.link/article/cross-chain-identity (accessed 2026-11-25; article last updated 2026-02-06).

- **Supports (as a concept/article):** DIDs, VCs, SBTs; identity mapping across chains; oracles + proofs anchoring attestations; **CCIP as a general messaging layer that synchronises identity/compliance state between chains**; ACE/CRE for allowlists and onchain compliance permissions.
- **Does not support (as published here):** a per-agent DeFi capability tuple with target + selector + value cap; version/epoch ordering; a concrete destination-enforcement contract or callback-authentication scheme. It is an educational/positioning article, not a shipped agent-permission product.
- **Relevance:** confirms "propagate state across chains so applications can query it" is a mainstream pattern; SCOPECAST narrows it to DeFi agent capabilities with ordering and enforcement.

### 3.5 MDPI — bidirectional bridge for cross-chain VC revocation
URL: https://www.mdpi.com/1999-4893/18/12/734; DOI https://doi.org/10.3390/a18120734 (metadata retrieved 2026-11-25 via Crossref; full text **403/inaccessible**).

- Paper: "A Bidirectional Bridge for Cross-Chain Revocation of Verifiable Credentials in Segregated Blockchains", *Algorithms* 18(12), art. 734, published 2025-11-21, Sofronie, Brînzea, Bratu, Aciobăniței, Pop.
- **Supports (per abstract):** on-chain smart contracts plus an **off-chain relay**; credentials issued/revoked on one chain validated from another; two Ethereum-compatible private networks (Geth, Besu); auditable low-latency checks; open-source prototype.
- **Does not support (as described):** DeFi method-level capabilities, epoch-versioned policy state, Reactive event subscriptions/callback authentication, or general on-chain DeFi action guards. It is identity-credential revocation across segregated private chains.
- **Relevance:** prior art for "revocation state must cross chains", with the opposite transport (off-chain relay) from SCOPECAST's Reactive callback path.

---

## 4. Search for an exact clone (2026-11-25)

Performed:
- GitHub repository search: `reactive omni buildathon` (83 results across pages), plus `reactive omni agent policy`, `reactive cross-chain permission revoke`, `reactive session key revocation`, `reactive capability policy agent`, `omni buildathon policy mirror` (**0 results each**).
- GitHub repository search `agent reactive omni created:>2026-11-01` (6 results): `manderson240/reactive-omni-agent`, `Night-Etrenal/agent-risk-guard`, `Feewk/sentinel-agent`, `DrVelvetFog/pocket-money`, `chainwright/pursestrings`, `NathaniaQuentin/sentinel`. All inspected or categorised in §2; none is a capability-policy mirror.
- GitHub code search: `PolicyUpdated epoch language:Solidity` returned 827 tokenised hits; the only relevant one was `trinnode/scopecast/contracts/src/PolicyHub.sol`, created **2026-11-25T11:01:14Z** — this is **SCOPECAST's own public repository**, not a competitor, and is excluded. Other hits (`UFragments`, `EpochBasketRedeemer`, etc.) are unrelated. Code searches for `sessionKey revoke reactive` / `capability policy reactive` were tokenised to uselessness or timed out.
- DoraHacks live build list (18 retrievable of 167) and the user's adjacent snapshot (§1).
- Web search tooling was unavailable (HTTP 402); the blog and docs were fetched directly.

**Result: no exact competing Reactive Omni entry found.** Two entries are materially close and must be named honestly: **Pocket Money** (versioned per-agent budget mirror + destination enforcement) and **Ration** (epoch ordering + strictly-newer-wins + destination enforcement). Neither mirrors a versioned *capability policy* from a source EVM registry; neither has per-target/per-selector authorization; neither is a clone. If the product were described only as "versioned cross-chain state mirrored by Reactive into a destination enforcer", these two would own that claim.

---

## 5. Competitive matrix (2026-11-25)

| Project | Chain pattern | Mechanism | Mirrors versioned capability policy? | Destination contract enforces? | Overlap with SCOPECAST | Source URL |
|---|---|---|---|---|---|---|
| **SCOPECAST** | Base Sepolia → Lasna → Unichain Sepolia | `PolicyHub` emits versioned policy; Reactive callback → `PolicyMirror` (strictly newer epoch wins) → `GuardedDeFiVault` checks agent/target/selector/cap/expiry/epoch | **Yes (by design)** | **Yes** | Reference | https://github.com/trinnode/scopecast (self, created 2026-11-25) |
| Pitstop | Lasna → Base + Unichain Sepolia gas tanks | Cron + cross-chain refill count → `freeze()` broadcast to all tanks; local owner `unfreeze()` | No (gas floors, global frozen bool, no version/epoch) | Yes (freeze + local cap) | **High concept, low mechanism**: multi-chain response to key leak, but gas heuristic vs policy | https://github.com/0xvikram/pitstop · https://dorahacks.io/build/51779 |
| Pocket Money | Lasna guard → Vaults on Base/Unichain/Ethereum Sepolia; SpendInbox for Sui/Solana | Per-agent daily allowance + household ceiling; `Synced(agent, version, ...)` → `syncBudget`; `Vault.canSpend()` pre-settlement; freeze everywhere | **Partial**: monotone versioned per-agent *budget* mirror, not capability tuple | **Yes** (`canSpend`, float caps, guard-only freeze) | **Highest found**: versioned per-agent cross-chain state + destination enforcement; differs in state shape, source of truth, revoke trigger, facilitator-view vs action guard | https://github.com/DrVelvetFog/pocket-money |
| Ration | Lasna hub → Vaults on Base/Unichain Sepolia | Budget slices, two-phase release→grant, `epochId += 1`, `resetEpoch` rejects `<= current`, replay ids, `closeEpoch` | **Partial**: epoch-ordered budget period, no agentId/target/selector/active; spender allowlist set locally | **Yes** (`spend()` checks allowlists, cap, slice, epoch window) | **High on epoch mechanics**, low on policy semantics; local revocation vs mirrored revoke | https://github.com/ace-coderr/ration |
| AgentRiskGuard | Origin chain + Lasna → same origin chain | AI risk score event → reactive freeze callback → `AgentVault.paused`; local `agent`, `maxPerTx` | No | Yes (single-chain freeze) | Low–medium: agent vault + reactive freeze, no cross-chain mirror | https://github.com/Night-Etrenal/agent-risk-guard |
| reactive-omni-agent (Reactive Sentinel) | Origin → Lasna → destination guard | `CollateralRatioAlert` → `callbackNonce` monotonic replay protection → defensive action | No (nonce ≠ policy epoch) | Yes | Low–medium: nonce/replay discipline is analogous but for callbacks | https://github.com/manderson240/reactive-omni-agent |
| Pursestrings | Lasna → Base/Unichain agent wallets | Shared daily allowance + one STOP freezes all chains | No version/epoch published | Yes (caps + STOP) | Medium: cross-chain agent allowance + freeze | https://github.com/chainwright/pursestrings |
| AI Risk Sentinel / Sentinel / OmniGuard AI | Uniswap/AI oracle → Lasna → vault | Model score → signed hold/pause/exit / funds to safety | No | Yes (pause/exit) | Low: AI risk signal driving on-chain defence | https://dorahacks.io/build/51791 · /51790 · /51789 |
| Notice Period | Morpho vault events → Reactive → user wallet | Curator change scheduled → user withdraws before it applies | No | Exit action | Low: time-bounded protective automation | https://dorahacks.io/build/51833 |
| Noether / RIFT / contagion-stop | Bridge / Lasna → multiple chains | Conservation invariant or bridge-failure trigger → freeze/payout | No | Freeze/payout | Low: cross-chain kill switch without capability policy | https://dorahacks.io/build/51836 · /51760 · https://github.com/0xward/contagion-stop |
| Tripwire / Nervo / Reactive Sentinel Vault / stop-loss repos | Base/Unichain ↔ Lasna | Price event → SL/TP or exit | No | Trade execution | Low: trading automation | https://dorahacks.io/build/51802 · /51821 · /51786 |
| Lifeline / Sweep Vault / AutoSave / Autopilot Allowance | Lasna → destination chains | Gas top-up, sweeps, savings, recurring transfers | No | Balance movement | Low: generic automation | https://dorahacks.io/build/51849 · /51847 · /51852 |
| Triage / Reactive AI Triage / chainguard / Delivery Court | Approval/payment events → Lasna/AI | Approval scoring, auto-revoke dangerous approvals, AI escrow | No | Approval/escrow actions | Low: approval revocation ≠ capability policy mirror | https://dorahacks.io/build/51826 · /51842 · /51772 · https://github.com/mokshupadhyay/chainguard |
| Alchemy Agent Wallets | Off-chain verification layer + EIP-7702 smart accounts (EVM + Solana) | Session capabilities, caps, selectors, expiry; backend revoke instant; onchain key uninstall mined | No cross-chain mirror/epoch | Yes onchain (session-key permissions) or backend | Medium: same permission tuple concept, no cross-chain sync | https://www.alchemy.com/overviews/agent-wallets-session-permission-model |
| MetaMask Advanced Permissions | ERC-7715/7710 on any EIP-7702 chain (incl. Base, Unichain) | Session account, scoped periodic/streaming/revocation permissions, caveat enforcers, sub-delegation | No cross-chain mirror/epoch | Yes (caveat enforcers) | Medium–high on scoping; low on cross-chain sync | https://metamask.com/news/introducing-advanced-permissions |
| Signo Execute | X Layer / Arbitrum Shield contract | One action, token, per-firing + lifetime limit, expiry, venues, trigger, required result; onchain revoke | No cross-chain mirror/epoch | Yes (Shield at firing) | Medium on policy tuple; low on cross-chain | https://docs.signo.fi/guides/limited-spending-rights-for-ai-agents |
| Chainlink cross-chain identity (article) | Conceptual, CCIP between chains | DIDs/VCs/SBTs + cross-chain messaging of identity/compliance state | No (identity state, not capability policy) | Not specified | Low–medium: propagation concept | https://chain.link/article/cross-chain-identity |
| MDPI VC revocation bridge | Geth ↔ Besu private chains | On-chain issuer/verifier + off-chain relay for cross-chain VC revocation | No (credential revocation, no epochs) | Verifier contract checks | Low: cross-chain revocation prior art | https://doi.org/10.3390/a18120734 |

---

## 6. Differentiation and novelty claim

**Exact line vs Pitstop:** Pitstop freezes *gas reserves* on every chain when a cross-chain refill heuristic suggests a leaked key; SCOPECAST mirrors an *owner-authored, monotonically versioned agent capability policy* into an integrated DeFi vault, where the strictly-newer-epoch rule prevents a stale callback from restoring a revoked method. It is not a gas manager, not a drain detector, and not a universal freeze.

**Exact line vs adjacent entries:** AI circuit breakers/Sentinels pause or exit on a **model/market signal**; Triage/chainguard score **transactions and approvals**; Notice Period is a **withdrawal** tool; Noether/RIFT are **bridge** protection; savings/sweep/allowance builds **move balances**. SCOPECAST synchronises **authorization state** — who may call which target, which selector, for how much, until when — and proves the callback path that carried it.

**Strongest honest novelty claim:** Within the buildathon builds and adjacent products inspected on 2026-11-25, SCOPECAST is the only design that combines (1) a versioned **capability** policy authored on a source EVM chain, (2) **event-driven Reactive mirroring** to a second EVM chain, (3) **strictly-monotonic epoch acceptance** so out-of-order callbacks cannot revive revoked capabilities, and (4) an **actual destination DeFi contract that enforces** the mirrored policy on every guarded action, with a verifiable callback trail. This is a *specific combination*, not a claim to have invented scoped agent permissions, cross-chain messaging, or cross-chain revocation. The honest caveats are that Pocket Money already implements a monotone versioned per-agent cross-chain mirror with destination enforcement, and Ration already implements ordered epochs with a strictly-newer-wins guard and destination enforcement; SCOPECAST's differentiated object is the **capability policy** and its **source-registry origin**, not the mirror or the epoch guard in isolation.

**Recommended phrasing:** "Reactive-powered cross-chain agent capability synchronisation with epoch-ordered destination enforcement." Do **not** use "world's first". Do **not** claim atomic/instant revocation, universality over unintegrated contracts, or that settled transactions are reversed.
