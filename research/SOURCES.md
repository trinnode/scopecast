# SCOPECAST research sources — accessed 2026-11-25

Every source actually read or queried during this research session is listed. Access date is **2026-11-25** for all entries unless noted. "Claim supported" maps to sections of `research/COMPETITIVE_LANDSCAPE.md`. Failed/unusable retrievals are recorded honestly rather than replaced with invented data.

## A. Buildathon primary sources

| # | URL | Access | Claim supported |
|---|---|---|---|
| A1 | https://dorahacks.io/hackathon/reactive-omni-buildathon/buidls (direct `curl -skL`) | 2026-11-25 | HTTP 405, body = AWS WAF "Human Verification" page → DoraHacks direct access blocked; documented in §0 |
| A2 | https://dorahacks.io/hackathon/reactive-omni-buildathon/build (direct `curl -skL`) | 2026-11-25 | Same WAF block; documented in §0 |
| A3 | https://api.dorahacks.io/api/hackathon/reactive-omni-buildathon | 2026-11-25 | Connection failed (HTTP 000); documented in §0 |
| A4 | https://r.jina.ai/https://dorahacks.io/hackathon/reactive-omni-buildathon/buidls | 2026-11-25 | Hackathon shell: 167 builds, 390 hackers, prize pool $5,500, timeline 2026/11/04 pre-reg → 2026/12/05 20:00 deadline, tags, submission requirements (§0, §1) |
| A5 | https://r.jina.ai/https://dorahacks.io/hackathon/reactive-omni-buildathon/build | 2026-11-25 | 18 most-recent build cards with IDs, names, tracks and published one-line descriptions (§1.2); page truncated after build 51760, so full 167 not enumerable |
| A6 | https://r.jina.ai/https://dorahacks.io/hackathon/reactive-omni-buildathon/build?page=2 | 2026-11-25 | Returned page shell with no build cards → client-side pagination, full list unavailable (§0) |
| A7 | https://r.jina.ai/https://dorahacks.io/hackathon/reactive-omni-buildathon/build?sort=latest&page=2 | 2026-11-25 | Same: no build cards; pagination limitation (§0) |
| A8 | https://r.jina.ai/https://dorahacks.io/hackathon/reactive-omni-buildathon/announcements | 2026-11-25 | No announcement text rendered; only generic cookie banner → record as no data (§0) |
| A9 | https://r.jina.ai/https://dorahacks.io/hackathon/reactive-omni-buildathon/detail | 2026-11-25 | Buildathon detail/brief: dates, $5,500 REACT prizes, three tracks, judging criteria, submission requirements, ground rules (§1.1) |
| A10 | https://dorahacks.io/build/51779 via https://r.jina.ai/https://dorahacks.io/build/51779 | 2026-11-25 | Pitstop full build description: GasTank per chain, Cron `service()`, cross-chain refill count, `freeze()` broadcast on drain, 23 Nov 2026 proof tx hashes, 12 tests (§2.1) |
| A11 | https://blog.reactive.network/ (via https://r.jina.ai/https://blog.reactive.network/) | 2026-11-25 | Blog index: official announcement dated 2026-11-04 found (§1.1) |
| A12 | https://blog.reactive.network/reactive-omni-buildathon-thirty-days-to-find-out-what-one-second-buys/ (via https://r.jina.ai/...) | 2026-11-25 | Official announcement: 5 Nov–5 Dec 2026, three tracks, chains, $5,500 in REACT, judging, public-repo rule, timestamp rule on Base Sepolia, Omni ~1 s blocks/instant finality (§1.1) |

## B. Reactive Network documentation (read via documented `--resolve` and Jina proxy)

| # | URL | Access | Claim supported |
|---|---|---|---|
| B1 | https://dev.reactive.network/ (direct `curl -sk --http1.1 --resolve dev.reactive.network:443:137.74.125.148`) | 2026-11-25 | Getting Started: CometBFT, ~1 s blocks, instant finality, reactive contracts subscribe to logs and issue cross-chain callbacks (§1.1, §2.1) |
| B2 | https://dev.reactive.network/callback-contracts (same resolve; and https://r.jina.ai/https://dev.reactive.network/callback-contracts) | 2026-11-25 | Callback contract pattern: `AbstractCallback`, callback proxy, `onlyServiceProvider` + `onlyCallbackSender`, injected first argument, callback billing, deployment order — basis for judging Pitstop/Pocket Money/Ration auth paths and SCOPECAST's callback path (§2.1, §2.2, §2.3, §6) |
| B3 | https://r.jina.ai/https://dev.reactive.network/ | 2026-11-25 | Full Getting Started text: legacy→Omni code changes, `SYSTEM.subscribe`, `requestCallbackV_1_0`, system contract `0x8888...`, removal of RVM/vm modifier (§1.1, §2) |
| B4 | https://r.jina.ai/https://dev.reactive.network/reactive-contracts | 2026-11-25 | Reactive contract authoring reference; read to confirm standard `react`/subscription/callback shape used by adjacent builds (§2) |
| B5 | https://r.jina.ai/https://dev.reactive.network/reactive-mainnet | 2026-11-25 | Mainnet/Lasna chain information and faucet reference; read for chain-pattern context (§1.1) |
| B6 | https://r.jina.ai/https://dev.reactive.network/reactive-mcp | 2026-11-25 | Reactive MCP docs; read as adjacent ecosystem context, no competitive claim drawn from it (§0 completeness) |
| B7 | https://blog.reactive.network/reactive-mcp-live-diagnosis-for-reactive-contracts/ (seen in B11 index) | 2026-11-25 | Not fetched in full; indexed only. No claim supported. |

## C. GitHub API queries (env -u GH_TOKEN -u GITHUB_TOKEN gh api)

| # | URL / query | Access | Claim supported |
|---|---|---|---|
| C1 | https://api.github.com/search/repositories?q=reactive+omni+buildathon (per_page=20, pages 1–5) | 2026-11-25 | 83 matching repos; 48 repo names/descriptions captured (pages 1, 2, 5) used to locate Pitstop/Pocket Money/Ration/adjacent entries (§2, §4) |
| C2 | https://api.github.com/search/repositories?q=agent+reactive+omni+created:%3E2026-11-01 | 2026-11-25 | 6 recently created agent+reactive repos (§4) |
| C3 | https://api.github.com/search/repositories?q=reactive+omni+agent+policy | 2026-11-25 | 0 results → no exact-clone repo by name/description (§4) |
| C4 | https://api.github.com/search/repositories?q=reactive+cross-chain+permission+revoke | 2026-11-25 | 0 results (§4) |
| C5 | https://api.github.com/search/repositories?q=reactive+session+key+revocation | 2026-11-25 | 0 results (§4) |
| C6 | https://api.github.com/search/repositories?q=reactive+capability+policy+agent | 2026-11-25 | 0 results (§4) |
| C7 | https://api.github.com/search/repositories?q=omni+buildathon+policy+mirror | 2026-11-25 | 0 results (§4) |
| C8 | https://api.github.com/search/repositories?q=pitstop+reactive+gas | 2026-11-25 | 1 result: `0xvikram/pitstop` (§2.1) |
| C9 | https://api.github.com/search/code?q=GasTank+DrainSuspected | 2026-11-25 | Located `src/Pitstop.sol`, `src/GasTank.sol`, README, SUBMISSION.md in Pitstop repo (§2.1) |
| C10 | https://api.github.com/search/code?q=PolicyMirror | 2026-11-25 | 2148 tokenised unrelated hits; no cross-chain capability-policy mirror found (§4) |
| C11 | https://api.github.com/search/code?q=sessionKey+revoke+reactive | 2026-11-25 | TLS timeout / no usable result; recorded as inconclusive (§4) |
| C12 | https://api.github.com/search/code?q=capability+policy+reactive | 2026-11-25 | 182659 tokenised hits, none relevant (§4) |
| C13 | https://api.github.com/search/code?q=per-agent+policy+mirror | 2026-11-25 | 74962 tokenised hits, none relevant (§4) |
| C14 | https://api.github.com/search/code?q=PolicyUpdated+epoch+language:Solidity | 2026-11-25 | 827 hits; only relevant hit `trinnode/scopecast/contracts/src/PolicyHub.sol` (own project); rest unrelated (§4) |
| C15 | https://api.github.com/repos/0xvikram/pitstop | 2026-11-25 | default branch `build`; created 2026-11-23; description (§2.1) |
| C16 | https://api.github.com/repos/0xvikram/pitstop/git/trees/build?recursive=1 | 2026-11-25 | File inventory: src/Pitstop.sol, src/GasTank.sol, test/Pitstop.t.sol, deployments, site (§2.1) |
| C17 | https://api.github.com/repos/{six candidate repos}/git/trees/{branch}?recursive=1 | 2026-11-25 | File inventories for pocket-money, agent-risk-guard, ration, reactive-omni-sentinel, chainguard, commitbook (§2.2–2.4) |
| C18 | https://api.github.com/repos/trinnode/scopecast | 2026-11-25 | Created 2026-11-25T11:01:14Z, default branch `main` → confirms code-search hit is SCOPECAST itself, excluded from competition (§4) |

## D. Raw source files read (raw.githubusercontent.com with `--resolve raw.githubusercontent.com:443:185.199.109.133`, or GitHub contents API)

| # | URL | Access | Claim supported |
|---|---|---|---|
| D1 | https://raw.githubusercontent.com/0xvikram/pitstop/build/src/Pitstop.sol | 2026-11-25 | Cron + `_onRefuel` cross-chain counter, `DrainSuspected`, `freeze()` broadcast to all tanks, no policy/epoch (§2.1) |
| D2 | https://raw.githubusercontent.com/0xvikram/pitstop/build/src/GasTank.sol | 2026-11-25 | `bool frozen`, `service()`, `freeze()`, local cap, fee reserve, owner-only `unfreeze`, AbstractCallback auth (§2.1) |
| D3 | https://raw.githubusercontent.com/ace-coderr/ration/main/README.md | 2026-11-25 | Budget-slice invariant, two-phase release→grant, epoch rollover, live loops, MCP agent, 112 tests (§2.3) |
| D4 | https://raw.githubusercontent.com/ace-coderr/ration/main/src/RationHub.sol | 2026-11-25 | `epochId += 1`, epochStart/End/Budget, `transferId` idempotency, stale-epoch returns, `resetEpoch`/`closeEpoch` callbacks, owner controls (§2.3, §5) |
| D5 | https://raw.githubusercontent.com/ace-coderr/ration/main/src/RationVault.sol | 2026-11-25 | `resetEpoch`: `if (epochId_ <= epochId) return;`; `spend()` checks spender/token/recipient allowlists, epoch window, slice, per-epoch cap; `SpenderSet` local owner-only (§2.3, §5) |
| D6 | https://raw.githubusercontent.com/ace-coderr/ration/main/test/EpochChange.t.sol | 2026-11-25 | Tests for forced start, idempotent close, lost/forged resets, clock skew, monotonic epoch behaviour (§2.3) |
| D7 | https://raw.githubusercontent.com/ace-coderr/ration/main/docs/ARCHITECTURE.md | 2026-11-25 | Callback proxy details and deployment context for Ration (§2.3) |
| D8 | https://raw.githubusercontent.com/DrVelvetFog/pocket-money/main/README.md | 2026-11-25 | Per-agent allowance across chains, budget mirror pushed to vaults, `canSpend` pre-settlement, freeze on unapproved payee/panic, SpendInbox for Sui/Solana, measured 2 s median (§2.2) |
| D9 | https://raw.githubusercontent.com/DrVelvetFog/pocket-money/main/src/PocketMoney.sol | 2026-11-25 | `Synced(agent, version, agentLeft, householdLeft)`, `_sync()`, `_book()`/quarantine, topUp/freeze/rebalance callbacks (§2.2) |
| D10 | https://github.com/DrVelvetFog/pocket-money/blob/main/src/Vault.sol (contents API) | 2026-11-25 | `syncBudget(...)` with `if (version <= syncVersion) return;`; `canSpend`/`spendLeft`; `freezeAgent`; owner-only unfreeze/setFloat; float caps (§2.2, §5, §6) |
| D11 | https://raw.githubusercontent.com/DrVelvetFog/pocket-money/main/src/SpendLimitRegistry.sol | 2026-11-25 | Per-chain payer→controller→mirror binding; controller changes mirror; zero lifts limit (§2.2) |
| D12 | https://raw.githubusercontent.com/DrVelvetFog/pocket-money/main/docs/x402-spend-limit-extension.md | 2026-11-25 | Facilitator-side spend-limit discovery/enforcement context (§2.2) |
| D13 | https://raw.githubusercontent.com/Night-Etrenal/agent-risk-guard/master/src/AgentGuardReactive.sol | 2026-11-25 | Watches `RiskFlagged` on origin chain, threshold, `freeze(address,bytes32)` callback (§2.4) |
| D14 | https://raw.githubusercontent.com/Night-Etrenal/agent-risk-guard/master/src/AgentVault.sol | 2026-11-25 | Local `agent`, `maxPerTx`, `paused`, guard-only `freeze`, owner-only `unfreeze`/`setAgent`; no cross-chain mirror (§2.4) |
| D15 | https://raw.githubusercontent.com/chainwright/pursestrings/main/README.md | 2026-11-25 | Shared daily allowance across Base/Unichain agent wallets; one STOP freezes all chains (§2.4, §5) |
| D16 | https://raw.githubusercontent.com/manderson240/reactive-omni-agent/main/README.md | 2026-11-25 | `CollateralRatioAlert` → `callbackNonce` monotonic replay protection → destination guard; AI triage; nonce ≠ policy epoch (§2.4, §5) |
| D17 | https://github.com/Night-Etrenal/agent-risk-guard/blob/master/README.md | 2026-11-25 | Fetch failed (HTTP 000); no claim drawn; repo classification from source files D13/D14 and search description C2 |

## E. Adjacent industry products

| # | URL | Access | Claim supported |
|---|---|---|---|
| E1 | https://www.alchemy.com/overviews/agent-wallets-session-permission-model | 2026-11-25 | CLI session capabilities/expiry/instant backend revoke; Wallet API session keys with per-token caps, gas limits, contract/function-selector allowlists, `expirySec`; onchain uninstall needs mined UserOp; guidance not to rely on onchain permission changes as instant kill switch (§3.1, §5) |
| E2 | https://metamask.com/news/introducing-advanced-permissions | 2026-11-25 | ERC-7715/7710 session accounts, periodic/streaming/revocation permissions, caveat enforcers, user-adjustable scopes, sub-delegation/hooks, EIP-7702 chains incl Base/Unichain, grant is signature not tx (§3.2, §5) |
| E3 | https://docs.signo.fi/guides/limited-spending-rights-for-ai-agents | 2026-11-25 | Execute permission fields (action/token/per-firing/lifetime/expiry/venues/trigger/required result), Shield enforcement on X Layer + Arbitrum, onchain revoke effective at inclusion, early access (§3.3, §5) |
| E4 | https://github.com/FlipLabsAI/signo-shield | 2026-11-25 | Linked from E3 as public Shield code; not fetched directly, no independent claim drawn |
| E5 | https://chain.link/article/cross-chain-identity | 2026-11-25 | DIDs/VCs/SBTs, CCIP cross-chain state synchronisation, ACE/CRE compliance; article last updated 2026-02-06; conceptual not a shipped agent-capability product (§3.4, §5) |
| E6 | https://www.mdpi.com/1999-4893/18/12/734 | 2026-11-25 | Direct fetch HTTP 403 / Jina fetch failed; full text inaccessible — recorded honestly (§0, §3.5) |
| E7 | https://api.crossref.org/works/10.3390/a18120734 | 2026-11-25 | Metadata: title "A Bidirectional Bridge for Cross-Chain Revocation of Verifiable Credentials in Segregated Blockchains", *Algorithms* 18(12) art. 734, published 2025-11-21, DOI 10.3390/a18120734, abstract describing Geth/Besu on-chain contracts + off-chain relay (§3.5, §5) |
| E8 | https://api.crossref.org/works?query.bibliographic=cross-chain%20credential%20revocation%20blockchain&rows=5 | 2026-11-25 | Confirmed DOI/article identity after MDPI direct access failed (§3.5) |

## F. Search tooling attempts (recorded for completeness)

| # | Tool / URL | Access | Claim supported |
|---|---|---|---|
| F1 | `websearch` tool, query "Reactive Omni Buildathon DoraHacks Every Second Counts builds list" | 2026-11-25 | Failed HTTP 402 → web search unavailable; search performed with GitHub API + direct fetch instead (§0, §4) |
| F2 | `webfetch` https://dorahacks.io/hackathon/reactive-omni-buildathon/buidls | 2026-11-25 | Timed out; no data (§0) |
| F3 | `webfetch` https://www.mdpi.com/1999-4893/18/12/734 | 2026-11-25 | HTTP 403; no data (§3.5) |
| F4 | https://www.google.com/search?q=%22Reactive+Omni+Buildathon%22+builds | 2026-11-25 | HTTP 200 but JS redirect with no results; no claim drawn |
| F5 | https://www.bing.com/search?q=%22Reactive+Omni+Buildathon%22&count=30 | 2026-11-25 | HTTP 200 but irrelevant cached results; no claim drawn |
| F6 | https://duckduckgo.com/html/?q=Reactive+Omni+Buildathon | 2026-11-25 | HTTP 000; no data |
| F7 | https://r.jina.ai/https://www.google.com/search?q=%22Reactive+Omni+Buildathon%22 | 2026-11-25 | HTTP 000; no data |
| F8 | https://r.jina.ai/https://doi.org/10.3390/a18120734 and https://r.jina.ai/https://www.mdpi.com/1999-4893/18/12/734/pdf | 2026-11-25 | HTTP 403 / empty PDF response; no claim beyond Crossref metadata (§3.5) |

## G. Internal reference (not public source)

| # | Path | Access | Claim supported |
|---|---|---|---|
| G1 | `/home/trinnex/Documents/CodeBase/personalProjects/Dorahacks/scopecast/SCOPECAST_REACTIVE_OMNI_MASTER_BUILD_SPEC.md` | 2026-11-25 | Internal thesis, differentiator, "what SCOPECAST is not", novelty standard, and user-supplied 25 Nov competition snapshot used as the adjacency checklist (§0, §1.2, §6) |
| G2 | `/home/trinnex/Documents/CodeBase/personalProjects/Dorahacks/scopecast/README.md` | 2026-11-25 | Internal statement that revocation is asynchronous and does not reverse settled transactions (§0, §6) |
