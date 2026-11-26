# SCOPECAST — Security model

> Testnet-only. Deployed addresses and hashes are recorded in `DEPLOYMENTS.md` from verified RPC
> receipts. This document describes the current `contracts/src/*.sol` implementation, including its
> limitations. It does not claim an external audit. Local Foundry tests are simulations; only
> verified testnet receipts prove a live callback.

## 1. Threat model summary

The full structured table is in `THREAT_MODEL.md`. The short version:

- The **owner** is the only source of policy authority on Base Sepolia; the agent cannot change its
  own policy.
- The **Reactive layer** is a trust boundary: only the system contract may call `react()`, and every
  log field is validated before a callback is requested.
- The **destination** trusts only the official callback proxy plus the one immutable authorised
  reactive contract, and re-verifies the canonical policy hash.
- **Ordering** is enforced three times (source epoch increments, reactive request watermark, mirror
  strictly-newer rule), so a delayed callback cannot resurrect a revoked capability.
- **Enforcement** is fail-closed at the vault, but only for modules that actually query the mirror.

## 2. Policy semantics

A policy is the nine-field `ScopedPolicy` tuple shared by `interfaces/IScopecast.sol`:

| Field | Meaning | Where checked |
| --- | --- | --- |
| `agentId` | Stable identifier (`bytes32`), not a display name | hub nonzero; reactive topics; mirror nonzero; vault lookup key |
| `agent` | Authorised signer address | hub nonzero; reactive nonzero; mirror nonzero; vault `msg.sender == policy.agent` |
| `destinationChainId` | `1301` | hub immutable; reactive check; mirror `== block.chainid`; vault `== block.chainid` |
| `destinationModule` | The one approved guarded module | hub immutable; reactive check; mirror `approvedModule`; vault `== address(this)` |
| `allowedSelector` | One function selector | hub nonzero; reactive nonzero; mirror nonzero; vault `== this.rebalance.selector` |
| `maxValue` | Per-action cap | hub nonzero; reactive nonzero; mirror nonzero; vault `0 < amount <= maxValue` |
| `expiresAt` | Timestamp deadline | hub freshness on create/update; vault `block.timestamp <= expiresAt` |
| `epoch` | Monotonic policy version | hub `+1` per mutation; reactive watermark; mirror strictly-newer rule |
| `active` | Grant / revoke flag | mirror state; vault requires `true` |
| `policyHash` | `PolicyHash.compute(...)` over the nine fields | recomputed in hub, reactive and mirror; mismatch drops or reverts |

`PolicyHash.compute` uses `keccak256(abi.encode(agentId, agent, destinationChainId,
destinationModule, allowedSelector, maxValue, expiresAt, epoch, active))`. The hash is the integrity
link across chains; because 0.8.29 ABI encoding is deterministic, the same tuple yields the same
hash on all three chains.

Source rules:

- `createPolicy`: owner-only, epoch 1, `active = true`, rejects an already-existing `agentId` and an
  expiry at or before the current timestamp.
- `updatePolicy`: owner-only, epoch `+1`, sets `active = true`; this is the only path that can
  reactivate a revoked policy, and only at a strictly higher epoch. It can be used to narrow a cap
  or move an expiry earlier.
- `revokePolicy`: owner-only, epoch `+1`, `active = false`. No freshness check, so revocation works
  even after natural expiry.
- `rotateAgentKey`: owner-only, epoch `+1`, replaces the agent address and preserves the active
  state (a revoked policy stays revoked). No freshness check.
- All mutations recompute the hash and emit `PolicyUpdated`; fields are validated in `_emitState`.

Destination rules:

- `applyPolicy` stores the whole tuple only when `epoch > storedEpoch`. Equal or older epochs emit
  `StaleCallbackIgnored` and return without changing state or reverting, which avoids wasting the
  receiver's gas reserve on a duplicate.
- `emergencyRevoke` is an admin-only local fallback: it sets `active = false`, advances the **local**
  epoch by one and recomputes the hash. It is not a substitute for the Reactive path. Because it can
  push the local epoch above the source epoch, subsequent source callbacks at lower epochs will be
  ignored (see residual risk in `THREAT_MODEL.md`).

## 3. Callback authentication

`PolicyMirror.applyPolicy` carries **two mandatory modifiers**, both from the pinned Omni library:

1. `onlyServiceProvider` — from `AbstractPayer` — checks `msg.sender == _SERVICE_PROVIDER`, the
   official Unichain Sepolia callback proxy
   `0x775c9B990ADe401060B78D0e98684eEf8d2466C1`. Without it, any EOA could call the callback and
   supply an arbitrary first argument.
2. `onlyCallbackSender(reactiveSender_)` — from `AbstractCallback` — checks the first payload
   argument against immutable `_CALLBACK_SENDER`, the one authorised `ScopeCastReactive` address.
   Reactive replaces the first 160 bits of the payload with the requesting contract's address, so
   `react()` encodes `address(0)` in that slot as a placeholder.

Both `_CALLBACK_SENDER` and `_SERVICE_PROVIDER` are immutable: a wrong constructor value is
unrecoverable without redeployment. This is why deployment uses predicted CREATE addresses rather
than the harness shortcut (see `ARCHITECTURE.md` §6).

`ScopeCastReactive.react()` is separately guarded by `onlySystem`: `msg.sender` must be the system
contract `0x8888888888888888888888888888888888888888` on Lasna.

Test evidence (local simulation): `PolicyMirror.t.sol::test_eoaCannotCallCallback`,
`test_proxyButWrongReactiveSenderIsRejected`, `test_correctCallbackAppliesPolicy`;
`ScopeCastReactive.t.sol::test_onlySystemCanCallReact`.

## 4. Replay and epoch rules

| Layer | Rule | Effect |
| --- | --- | --- |
| `PolicyHub` | `epoch = previous + 1` on every mutation | Source history is strictly ordered; no actor can install an older epoch. |
| `ScopeCastReactive` | `if (epoch <= latestRequestedEpoch[agentId]) return;` | Duplicate deliveries of the same log, and out-of-order old logs, never trigger a second callback request. |
| `PolicyMirror` | `if (epoch <= storedEpoch) { emit StaleCallbackIgnored(...); return; }` | Old or repeated callbacks cannot overwrite or reactivate; no revert, so gas is not wasted. |
| `GuardedDeFiVault` | Reads `getPolicy` on every call; no cached authorisation | A policy change is effective at the destination as soon as the callback is confirmed. |

Additional anti-spoof checks at the reactive layer: `chainId == 84532`, `contractAddress == originHub`,
`topic0 == 0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9`, `opCode == 4`
(three indexed parameters → LOG3), nonzero `agentId`/`agent`/`epoch`, destination chain and module
match, nonzero selector and cap, and canonical hash equality. Irrelevant logs return silently: a
reverted react is still billed by the network.

Callback gas is immutable at deploy time: the system contract ignores requests below **100,000**
gas (enforced by `ScopeCastReactive`'s constructor), and the Reactive transaction gas cap is
**900,000**. The local harness uses 300,000; the deployed contract uses 800,000 because the callback
receipt.

## 5. Guarded enforcement

`GuardedDeFiVault.rebalance(agentId, amount)` reads the mirror and checks, in order:

1. `policy.active` — otherwise `AgentPolicyInactive`.
2. `msg.sender == policy.agent` — otherwise `WrongAgent`.
3. `policy.destinationChainId == block.chainid` — otherwise `WrongChain`.
4. `policy.destinationModule == address(this)` — otherwise `WrongTarget`.
5. `policy.allowedSelector == this.rebalance.selector` — otherwise `WrongSelector`.
6. `block.timestamp <= policy.expiresAt` — otherwise `PolicyExpired`.
7. `0 < amount <= policy.maxValue` — otherwise `ActionCapExceeded`.
8. `amount <= holdings` — otherwise `InsufficientHoldings`.

The action has effects only: it moves test units from `holdings` to `deployed` and emits
`ActionExecuted`. There is no recipient parameter, no arbitrary target call and no alternate agent
entry point. `seed`, `withdraw` and `transferOwnership` are owner-only and never consult policy.
`rebalance` is `nonReentrant`.

> Integration note: the vault's selector is `rebalance(bytes32,uint256)`. A policy built with
> `rebalance(uint256)` (the selector used in `PolicyHub.t.sol` and suggested in the build spec's
> example) will fail the vault's `WrongSelector` check. Use the live vault's actual selector when
> authoring a real policy.

## 6. Known limitations

- **Asynchronous.** Propagation takes a source confirmation, a Reactive transaction and a
  destination callback. SCOPECAST never claims instant or atomic revocation.
- **No retroactive reversal.** An agent transaction included before the revoke callback remains
  settled; the demo shows exactly this.
- **Only integrated modules are protected.** Any contract that does not query `PolicyMirror` is out
  of scope; this is not universal revocation.
- **Receiver-pays gas.** Callback execution is billed to `PolicyMirror` in Unichain Sepolia native
  ETH. A failed callback is still charged; a recipient in debt receives nothing.
- **Privileged roles.** Source owner, reactive owner and destination admin must be multisigs or
  smart accounts in production; the repository's `.env.example` keys are for testnet use only.
- **Mutable reactive recipient.** `setDestinationMirror` is owner-controlled and can be changed
  after bootstrap; monitor it.
- **No automatic retry of a consumed epoch.** `latestRequestedEpoch` advances when the callback is
  *requested*, not when it succeeds. A failed delivery at epoch n is not automatically re-requested.
- **`emergencyRevoke` local epoch jump.** It advances only the destination epoch; if it exceeds the
  source epoch, later legitimate source callbacks at lower epochs are ignored until the source
  catches up.
- **Freshness on create/update only.** Revoke and rotate intentionally work after expiry; `expiresAt`
  is a deadline for guarded actions, not a self-deleting policy.
- **Test asset.** `MockAsset` is freely mintable and valueless; never deploy it to a mainnet.
- **Local harness is not proof.** `IntegrationHarness.t.sol` stubs the system contract and proxy
  with `vm.etch` and uses a placeholder reactive address; it demonstrates decoding and state logic
  only.

## 7. Verification status

`forge build` and `forge test -vvv` are the reproducibility commands (`RUNBOOK.md`). Named tests
cover owner access control, epoch monotonicity, hash integrity, forged-callback rejection, stale
callbacks, unapproved modules, every guarded vault rejection path, and a local full lifecycle with
"settled action is not reversed". These are **local simulations**. Live evidence requires the real
Base → Lasna → Unichain receipt set recorded in `DEPLOYMENTS.md`; until then the console shows
`UNKNOWN` / `DESTINATION_SYNC_UNKNOWN` and labels local runs `SIMULATION`.
