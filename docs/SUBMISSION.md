# SCOPECAST — DoraHacks submission

> Track: **Every Second Counts** (DeFi where reaction time matters; Unichain Sepolia and/or Base
> Sepolia with Reactive Lasna in the middle). Do not submit to **Reactive Meets AI**: no AI model is
> part of the running system.
>
> All on-chain values below stay `<PENDING_DEPLOY>` / `<PENDING_TX>` until confirmed from verified
> receipts in `DEPLOYMENTS.md`. Do not submit until the real Base → Lasna → Unichain callback path
> has been verified. Local Foundry tests are simulation, not evidence.

## 1. Copy-ready submission text

**Title**

```
SCOPECAST — Reactive-powered cross-chain agent capability synchronisation
```

**One-line description**

```
One owner-authored, versioned DeFi agent policy on Base Sepolia, mirrored through Reactive Omni into an enforcing guard on Unichain Sepolia.
```

**Problem**

```
A delegated DeFi agent can hold scoped permissions on more than one chain. Updating each chain
separately is slow, error-prone and easy to miss: an operator can revoke one session while a second
integrated chain still enforces the old permission.
```

**What SCOPECAST does**

```
PolicyHub on Base Sepolia is the single authoritative registry. The owner creates, narrows, rotates
or revokes a capability policy; every mutation increments a monotonic epoch and emits PolicyUpdated.
ScopeCastReactive on Reactive Lasna subscribes to that exact event, validates the origin chain,
emitter, topic, topic count, destination binding and canonical policy hash, then requests an
authenticated callback. PolicyMirror on Unichain Sepolia accepts callbacks only from the official
callback proxy AND the one authorised reactive contract, and applies only strictly newer epochs.
GuardedDeFiVault reads the mirror on every agent action and checks active state, agent, chain, target
module, function selector, value cap and expiry before moving test units between two mock positions.
```

**Security property demonstrated**

```
An agent's bounded action succeeds before the revoke callback reaches the destination. After the
newer epoch is applied by the authenticated callback, the exact same action is rejected by the
destination contract. A late or duplicate callback at an older epoch cannot reactivate the revoked
capability.
```

**What SCOPECAST does not claim**

```
Revocation is asynchronous: it is not instant, atomic or universal. Already-settled transactions are
not reversed. Only modules that integrate the mirror are protected. The callback receiver pays for
destination execution in the destination chain's native token. The source owner should be a
multisig in production. All activity is testnet-only and uses a valueless mock token.
```

**Status**

```
Built during the Reactive Omni Buildathon. Public repository: https://github.com/trinnode/scopecast.
Live app: https://scopecast.vercel.app/ ; local run: `cd apps/web && pnpm dev`.
```

## 2. Deployed addresses and hashes

All values below come from `DEPLOYMENTS.md`, which was filled only from independently verified RPC
receipts on 2026-11-25.

| Item | Value |
| --- | --- |
| Public repository URL | `https://github.com/trinnode/scopecast` |
| Live app URL | `https://scopecast.vercel.app/` (HTTP 200 verified 2026-11-26) |
| `PolicyHub` (Base Sepolia, 84532) | `0xc8B5A34BC6791138d107E1348A24bB7c27C766e4` |
| `ScopeCastReactive` (Reactive Lasna, 5318007) | `0x155c0CbEdfBA688974A7354D39797c09667f98a3` |
| `PolicyMirror` (Unichain Sepolia, 1301) | `0xFd036Ad562A612cEF82db4893558C09bBA8664D8` |
| `GuardedDeFiVault` (Unichain Sepolia, 1301) | `0x6AA08fD4C41D4e66CC27f654bE4f8f0e71029DBD` |
| `MockAsset` (Unichain Sepolia, 1301) | `0xcfF438ec5B4AB5Afef185D5C2b270c9fFFF5fc8e` |
| Grant — source | `0xb8d1c99253cf7b7c737878abf0862a372aaee8db64f918ccc94c84a9e61c083a` |
| Grant — reactive | `0xb7ba1b7abbb21e87d97a65f445e761957be5b8acaa573432bf7e5aa869c8a1e3` |
| Grant — callback | `0xc42a91950fa0005bd8576a73c34c2811dbe1f726f0827bc0cb10803eeeafa73c` |
| Pre-revoke allowed action | `0x5aba6e8332a4a705278893d1f68c388c1ecd9b5dbd6df350c278809167453cf4` |
| Revoke — source | `0xff1505decd47016664421af80d15369eb5b4817204ebe11dcfdce780eeafc25d` |
| Revoke — reactive | `0x26f412c5179d8413de903a61ccad55caae5f2addf84a9ffa5199af62cb331b91` |
| Revoke — callback | `0x97d2a79dac850272906e637b2bc8862a39aa97b985c6fd0c9055428d0a540112` |
| Post-revoke denial | labelled `eth_call` simulation, revert selector `0x5aff86e7` (`AgentPolicyInactive`) |
| Measured propagation | 3,000 ms (destination block timestamp − source block timestamp) |
| Demo video (< 3 minutes) | pending production |

Explorer links use the right chain: Base Sepolia `https://sepolia.basescan.org/tx/<hash>`,
Lasna `https://lasna.reactscan.net/tx/<hash>`, Unichain Sepolia
`https://sepolia.uniscan.xyz/tx/<hash>`.

## 3. Track selection

Select **Every Second Counts**. The judging criteria are execution, integration, usefulness and
craft, equally weighted; entries without an actual reactive transaction and callback are not scored
further. SCOPECAST's execution evidence is the Lasna `react()` transaction and the Unichain callback
receipt, not a UI animation. The measured propagation window is reported from receipts (source
confirmation → destination confirmation), with no "instant" or "sub-second end-to-end" claim unless
that measurement actually supports it.

## 4. Honest differentiation

Phrasing to use:

```
Reactive-powered cross-chain agent capability synchronisation with epoch-ordered destination enforcement.
```

Do **not** use "world's first". Do not claim atomic, instant or universal revocation, and do not
claim to have invented scoped agent permissions, cross-chain messaging or cross-chain revocation.

| Project | What it actually does | SCOPECAST's difference |
| --- | --- | --- |
| **Pitstop** (`0xvikram/pitstop`, build 51779) | Cron-driven gas refills; a cross-chain refill count heuristic broadcasts `freeze()` to gas tanks; local owner `unfreeze()`. No `agentId`, target, selector, per-method cap, expiry or version counter. | SCOPECAST is not a gas product, a drain heuristic or a freeze-everything switch. It mirrors an **owner-authored, monotonically versioned capability tuple** (agent / target / selector / cap / expiry / active / epoch) into an integrated DeFi guard, where strictly newer epochs win and a late callback cannot restore a revoked method. |
| **Pocket Money** (`DrVelvetFog/pocket-money`) | Genuine monotone versioned per-agent state mirror (`version <= syncVersion` reject) and destination enforcement — but the mirrored state is a **remaining-budget scalar** from the guard's own spend ledger, and enforcement is a facilitator view check before x402 settlement. | SCOPECAST's versioned object is a **capability policy** (target contract + function selector + value cap + expiry + active), authored on a **source EVM registry** and enforced by a general DeFi action guard that reverts. This is the strongest overlap found; claim the capability-policy wedge, not "versioned cross-chain state mirror" in general. |
| **Ration** (`ace-coderr/ration`) | Ordered budget epochs with `epochId += 1`, `resetEpoch` rejecting `<= current`, two-phase release→grant and destination spend checks — but the epoch is a **budget period**, the payload is a budget slice, and the spender allowlist is a **local owner-only setter** (revocation must be done on each chain). | SCOPECAST's epoch is a **policy version emitted by a source registry**, and revocation is authored once and propagated; there is no per-chain local revocation step, and enforcement is per-method, not per-budget-period. Ration owns ordered epochs mechanics; SCOPECAST orders a capability policy. |

The honest novelty claim is a **specific combination**: (1) a versioned capability policy authored on
a source EVM chain, (2) event-driven Reactive mirroring to a second EVM chain, (3) strictly-monotonic
epoch acceptance so out-of-order callbacks cannot revive revoked capabilities, and (4) a real
destination DeFi contract enforcing the mirrored policy on every guarded action with a verifiable
callback trail. Adjacent wallet systems (Alchemy session permissions, MetaMask Advanced Permissions,
Signo) support scoped capabilities but do not propagate one registry's policy across chains via
Reactive callbacks.

## 5. Reproducibility checklist

- [ ] Public, open-source repository with all contracts, tests and docs.
- [ ] `forge build` and `forge test -vvv` pass locally (labelled simulation).
- [ ] Chain IDs, system contract and callback proxy re-verified by RPC near submission time.
- [x] Contracts deployed with owner-only bootstrap; immutables and configuration verified by `cast call`.
- [x] Subscription active; source grant → reactive → callback receipts captured and linked.
- [x] Pre-revoke allowed action and post-revoke rejection captured and correctly labelled.
- [x] `DEPLOYMENTS.md` filled only from receipts; console `flow.json` flipped to `verified: true` only then.
- [ ] Demo video under three minutes; no local simulation spliced into the live section.
- [ ] Honest scope statement included; no "instant"/"atomic"/"universal"/"world's first" wording.
