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
Built during the Reactive Omni Buildathon. Public repository: <PENDING_DEPLOY>.
Live app: <PENDING_DEPLOY>.
```

## 2. Deployed addresses and hashes

Fill from `DEPLOYMENTS.md` only after receipt verification.

| Item | Value |
| --- | --- |
| Public repository URL | `<PENDING_DEPLOY>` |
| Live app URL | `<PENDING_DEPLOY>` |
| `PolicyHub` (Base Sepolia, 84532) | `<PENDING_DEPLOY>` |
| `ScopeCastReactive` (Reactive Lasna, 5318007) | `<PENDING_DEPLOY>` |
| `PolicyMirror` (Unichain Sepolia, 1301) | `<PENDING_DEPLOY>` |
| `GuardedDeFiVault` (Unichain Sepolia, 1301) | `<PENDING_DEPLOY>` |
| `MockAsset` (Unichain Sepolia, 1301) | `<PENDING_DEPLOY>` |
| Grant — source / reactive / callback tx | `<PENDING_TX>` / `<PENDING_TX>` / `<PENDING_TX>` |
| Revoke — source / reactive / callback tx | `<PENDING_TX>` / `<PENDING_TX>` / `<PENDING_TX>` |
| Pre-revoke allowed action tx | `<PENDING_TX>` |
| Post-revoke denial | `<PENDING_TX>` (revert) or labelled `eth_call` simulation |
| Measured source-to-destination propagation | `<PENDING_DEPLOY>` ms, method stated in `DEPLOYMENTS.md` |
| Demo video (< 3 minutes) | `<PENDING_DEPLOY>` |

Explorer links must use the right chain: Base Sepolia `https://sepolia.basescan.org/tx/<hash>`,
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
- [ ] All three contracts deployed with predicted CREATE addresses; immutables verified by `cast call`.
- [ ] Subscription active; source grant → reactive → callback receipts captured and linked.
- [ ] Pre-revoke allowed action and post-revoke rejection captured and correctly labelled.
- [ ] `DEPLOYMENTS.md` filled only from receipts; console `flow.json` flipped to `verified: true` only then.
- [ ] Demo video under three minutes; no local simulation spliced into the live section.
- [ ] Honest scope statement included; no "instant"/"atomic"/"universal"/"world's first" wording.
