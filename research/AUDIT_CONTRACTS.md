# SCOPECAST — independent smart-contract and deployment audit

**Date:** 2026-11-26
**Auditor stance:** adversarial, read-only. No commits, no secret values printed or written.
**Scope:** `contracts/src/*.sol`, `contracts/test/*.sol`, `contracts/lib/reactive-lib` (pinned), `contracts/foundry.toml`, `scripts/deploy.sh`, `apps/web/scripts/flow.mjs`. Cross-checked against live chain getters on the three documented RPCs.

**Bottom line:** **No CRITICAL on-chain issue was found.** The on-chain trust chain (hub owner → system-contract-only `react` → canonical hash → dual callback auth → guarded vault) is internally coherent and the live configuration is wired correctly. The highest-impact problems are in the *evidence and deployment tooling*, plus two real availability/semantics defects in the epoch model. Test pass rate (51/51) is not evidence of correctness; several defects below are untested by the suite.

---

## Findings (severity ranked)

### HIGH-1 — `flow.mjs` publishes `verified: true` evidence from unverified inputs and swallows its own failure assertion
**Files:** `apps/web/scripts/flow.mjs:177-189`, `:202-211`, `:223-234`, `:236-255`

**Concrete failure / exploit:**
1. Resume paths bypass receipt verification. With `SKIP_GRANT=1 GRANT_TX=0x<arbitrary>` (`:181`) and `SKIP_ACTION=1 ACTION_TX=0x<arbitrary>` (`:203`), the hashes are assigned straight from environment variables. They never pass through `verified()` (`:157-168`). The object written at `:236-251` still sets `verified: true`, and `:254` writes `apps/web/public/evidence/flow.json`. The web console then presents attacker/operator-chosen hashes as independently verified three-chain receipts.
2. The post-revoke denial assertion is self-defeating. At `:226-230`, if `simulateContract` **succeeds** (i.e. revocation did *not* take effect), the code throws `"Simulation unexpectedly succeeded — revocation did not take effect"` — but that `throw` is inside the same `try` whose `catch` at `:231-233` treats any throw as the expected denial. The run exits successfully, logs `POST-REVOKE DENIAL` with a message saying revocation failed, and writes `verified: true`.
3. Placeholders are written as verified data: `:239` and `:242` emit `"reactive": "SEE_LASNA_TX"` while `verified: true` is set at `:237`. The checked-in `flow.json` only became fully populated because someone manually edited it afterwards — re-running the script overwrites verified evidence with placeholders.
4. `findCallbackHash()` (`:144-155`) filters only by `epoch` and takes `.pop()` of the last 900 blocks. Any other agent's callback at the same epoch can be attributed as this flow's callback.

**Fix:** Call `verified()` on every resumed hash and assert the receipt contains the expected `PolicyUpdated`/`PolicyMirrored` log for the exact `agentId`, `epoch` and `policyHash`. Move the "simulation unexpectedly succeeded" check *outside* the `catch` (use a `denied` boolean set only when the caught error carries the expected `AgentPolicyInactive` selector), and `process.exit(1)` without writing evidence on any mismatch. Refuse to write when any field is a placeholder. Add `args: { agentId }` to the `getLogs` filter at `:147-152`.

---

### HIGH-2 — `deploy.sh` does not reproduce the final live configuration: callback gas limit is the known-broken 300,000
**Files:** `scripts/deploy.sh:25`, `:59-62`; `docs/DEPLOYMENTS.md:57-59`

**Concrete failure:** `CALLBACK_GAS_LIMIT=300000` is passed to the `ScopeCastReactive` constructor (`:61`), whose gas limit is immutable. `docs/DEPLOYMENTS.md:59` records the empirically observed reason for changing this: 300,000 left the receiver with ~120,000 gas and the callback reverted with "not enough gas for reentrancy sentry"; the live contract was redeployed with **800,000** (confirmed on-chain in this audit: `callbackGasLimit() = 800000` on `0x155c…98a3`). A clean run of `deploy.sh` therefore recreates a system in which *every* callback fails at the destination. Because of MEDIUM-3 below (epoch is advanced at request time), the first grant/revoke is never retried and the destination stays stale until an unrelated owner mutation.

**Fix:** Set `CALLBACK_GAS_LIMIT=800000` (or read it from a named env var with an explicit `100000..900000` bound check) and add `callbackGasLimit()`, `policyTopic0()`, `originHub()`, `expectedDestinationModule()` to the post-deploy assertions at `:99-107`.

---

### MEDIUM-1 — `emergencyRevoke` and the source hub use the *same* epoch namespace; a legitimate callback can be permanently ignored
**Files:** `contracts/src/PolicyMirror.sol:148-169` (especially `:150-152`), `:120-126`; `contracts/src/ScopeCastReactive.sol:183-187`

**Concrete failure scenario:**
1. Hub grant at epoch 1 → reactive requests epoch 1 → mirror stores epoch 1, active=true.
2. Destination admin calls `emergencyRevoke` → mirror `current.epoch = 2`, active=false (`:150-152`).
3. Hub owner calls `updatePolicy` → hub epoch 2, active=true. Reactive sees `2 > latestRequestedEpoch=1`, so it requests a callback (`:186-187`). The mirror sees `epoch (2) <= storedEpoch (2)` and emits `StaleCallbackIgnored` (`:121-125`).
4. Source says active at epoch 2; destination stays revoked. The hub will never emit epoch 2 again, so the grant is silently lost until the owner performs a *third* mutation. Each extra `emergencyRevoke` widens the gap by one epoch and blocks one more legitimate source epoch.
5. Special case: `emergencyRevoke` on an `agentId` that has no policy sets `_exists=true` with `epoch=1` and zeroed fields (`:149-164`). The very first legitimate `createPolicy` (always epoch 1) is then ignored forever.

Impact is fail-*closed* (no unsafe activation), so this is an availability/consistency defect, not a privilege escalation. The existing test `PolicyMirror.t.sol:190-201` only covers the opposite direction (an *older* callback arriving late) and misses this case.

**Fix:** Separate the two counters. Track `lastSourceEpoch` (advanced only by an accepted `applyPolicy`) and `localRevokeEpoch` (advanced only by `emergencyRevoke`). Gate `applyPolicy` on `epoch > lastSourceEpoch`, not on the locally bumped epoch; keep `active=false` until a strictly newer source epoch arrives. This preserves the "late old callback cannot undo emergency revoke" property while allowing the next genuine source epoch through. Additionally require `_exists[agentId]` (or `current.destinationModule != address(0)`) in `emergencyRevoke`.

---

### MEDIUM-2 — `updatePolicy` silently reactivates revoked policies
**Files:** `contracts/src/PolicyHub.sol:106-117` (hardcoded `true` at `:116`), compare `:140-155`

**Concrete failure:** Owner revokes a compromised agent (`revokePolicy`, epoch 2, active=false). Later the owner calls `updatePolicy` on the same `agentId` only to narrow the cap or selector. Line 116 unconditionally passes `active = true`, so the source emits an active policy at epoch 3; the reactive contract forwards it and the mirror reactivates the agent. An operation intended to be a restriction becomes a grant. `rotateAgentKey` correctly preserves `current.active` (`:152`), so this is an inconsistency between sibling mutation paths.

**Fix:** Make reactivation explicit: preserve `current.active` in `updatePolicy` and add a dedicated owner-only `setActive(agentId, bool)` / `reactivatePolicy(agentId)` that emits a new epoch. Do not let a narrowing operation change the active flag implicitly.

---

### MEDIUM-3 — No callback retry: `latestRequestedEpoch` advances at *request* time, not delivery time
**Files:** `contracts/src/ScopeCastReactive.sol:183-187`; `contracts/lib/reactive-lib/src/interfaces/IPayable.sol:12-15`; `docs/CALLBACK_OPERATIONS.md:80-82`

**Concrete failure:** A callback fails on Unichain for any documented reason (out of gas, debt, module not yet approved, wrong sender). The request was already recorded at `:187`; a redelivery of the same log is ignored by `:186`. There is no owner-only reset and no delivery acknowledgement, so the source/mirror divergence persists until some future hub mutation creates a higher epoch. This is what turns HIGH-2's 300,000 gas limit from a transient error into a permanent stale state.

**Fix:** Have the mirror emit an acknowledgement containing `(agentId, epoch, policyHash)` and only advance the reactive-side watermark on acknowledgement; or add an owner-only `retryCallback(agentId)` that resets the watermark after reading the mirror's current `latestEpoch`. Also emit a `CallbackRequested` event with the exact epoch so operators can detect an unacknowledged request.

---

### MEDIUM-4 — Tracked `contracts/deployed-addresses.env` is stale and self-inconsistent
**File:** `contracts/deployed-addresses.env:1-5` (tracked by git)

**Concrete failure:** The file lists hub `0xA4F9…179`, mirror `0x9954…Cc64`, token `0x65A1…6b` and — impossibly — the **same address** (`0xCc07…3A97`) for both the Unichain vault and the Lasna reactive contract. None of these match the verified live addresses in `docs/DEPLOYMENTS.md:57-63` or the root `.env` (hub `0xc8B5…e4`, reactive `0x155c…8a3`, mirror `0xFd03…Cc64`, vault `0x6AA0…2DBD`, token `0xcfF4…fc8e`). A user who copies this tracked file into `.env` points the UI and `flow.mjs` at unrelated/placeholder contracts, and `flow.mjs` would then write "verified" evidence against the wrong addresses.

**Fix:** Remove the file from version control (it is deployment output), or regenerate it from the same receipts used for `docs/DEPLOYMENTS.md` and add a CI check that each address resolves to code with the expected getter values on its own chain.

---

### MEDIUM-5 — `deploy.sh` verification step calls a getter that does not exist and aborts the script
**File:** `scripts/deploy.sh:100`, with `set -euo pipefail` at `:4` and command substitution at `:105`

**Concrete failure:** The verification loop calls `reactiveSender()` on `PolicyMirror`. `PolicyMirror` (via `AbstractCallback`) exposes `_CALLBACK_SENDER()`, not `reactiveSender()`. A live read-only call to `reactiveSender()` at `0xFd03…Cc64` reverts with `execution reverted`; under `set -e` the command substitution fails and the script exits before writing `deployed-addresses.env` (`:109-115`). The newly deployed contracts are then undocumented.

**Fix:** Replace `reactiveSender()` with `_CALLBACK_SENDER()`. While there, assert *expected values* rather than just printing them: hub `expectedDestinationModule()`, reactive `policyTopic0()`/`callbackGasLimit()`/`originHub()`, mirror `_SERVICE_PROVIDER()`/`admin()`/`approvedModule(vault)`, vault `mirror()`/`asset()`.

---

### LOW-1 — Expiry boundary is inconsistent between hub and vault (off-by-one)
**Files:** `contracts/src/PolicyHub.sol:221` (`expiresAt <= block.timestamp` is expired) vs `contracts/src/GuardedDeFiVault.sol:114` (`block.timestamp > policy.expiresAt` is expired)

At exactly `block.timestamp == expiresAt`, the hub considers the policy expired and refuses to write it, but the vault still authorises an action. One-second window of divergent authorisation. **Fix:** use `block.timestamp >= policy.expiresAt` in the vault (or document and test the boundary explicitly).

---

### LOW-2 — Mirror accepts expired active policies; `rotateAgentKey` can re-emit one
**Files:** `contracts/src/PolicyMirror.sol:87-142` (no `expiresAt` check), `contracts/src/PolicyHub.sol:140-155` (`enforceFreshness=false` at `:153`)

After natural expiry, an owner `rotateAgentKey` on a still-active policy writes `active=true` with a past `expiresAt`, the reactive contract forwards it (it also never checks expiry), and the mirror stores an "active but expired" policy. The current vault still rejects it (`GuardedDeFiVault.sol:114`), so no unsafe action occurs, but any future module that trusts `active` without re-checking expiry would be exposed. **Fix:** add `if (active && expiresAt <= block.timestamp) revert ExpiredPolicy()` in `applyPolicy`, and enforce freshness in `rotateAgentKey` when `current.active` is true.

---

### LOW-3 — Integration harness stubs both providers and never tests the injected-sender chain
**Files:** `contracts/test/IntegrationHarness.t.sol:36-37`, `:40`, `:68-70`, `:99-131`, `:133-147`

The harness is honest in its comment (`:13-15`) that it is not live evidence. Its payload *shape* test is real: it decodes the actual `PolicyAccepted` payload emitted by `react` and slices off the 4-byte selector (`:100-130`). But delivery is faked: the mirror's immutable `_CALLBACK_SENDER` is a hardcoded `0x5150` (`reactivePredicted()`), while the real reactive contract is deployed at another address, and the harness manually passes that constant as `reactiveSender_` under `vm.prank(PROXY)` (`:134-136`). It asserts only `injected == address(0)` (`:131`). Consequently it cannot catch a wrong `_CALLBACK_SENDER` constructor argument, a payload that violates the first-160-bit overwrite rule, or a proxy that fails to inject. `vm.etch` at `:36-37` also means subscribe/unsubscribe/callback gas behaviour is never exercised.

**Fix:** Deploy `ScopeCastReactive` first, predict/derive its actual address, construct the mirror with that address, and implement a stub proxy that performs the real first-160-bit overwrite on the payload emitted by `react` rather than passing a hand-written constant. Add a negative test with a different injected sender.

---

### LOW-4 — `findCallbackHash` can attribute the wrong callback
**File:** `apps/web/scripts/flow.mjs:144-155`

See HIGH-1 item 4. **Fix:** filter by `agentId` and verify the chosen receipt's log has the expected `epoch` and `policyHash`; fail on zero or multiple matches instead of `.pop()`.

---

### LOW-5 — Documentation contradicts the deployed code on `opCode` and subscription mutability
**Files:** `docs/SECURITY.md:101-102`, `docs/ARCHITECTURE.md:21`, `:90`, `docs/THREAT_MODEL.md:17`, `docs/CALLBACK_OPERATIONS.md:89`, `:96-98`, `apps/web/app/page.tsx:175`

These claim `opCode == 3` for `PolicyUpdated` (three indexed parameters) and that the subscription cannot be changed at runtime. Both are wrong for the current code: the event has **four topics** (signature + 3 indexed), so `opCode == 4` (`ScopeCastReactive.sol:145-148`, `README.md:95-96`), and `configure()` (`:97-121`) does unsubscribe/resubscribe. `docs/SECURITY.md:80-82` also claims predicted CREATE addresses are used, while `deploy.sh` uses a `0x…0001` placeholder plus `configure()`. The code is correct; the docs are stale and could mislead an operator into debugging the wrong filter.

**Fix:** Update the cited doc locations to `opCode == 4` / LOG4 and document the owner-only `configure()` re-subscription path, including the verified configure transactions already recorded in `docs/DEPLOYMENTS.md:46-51`.

---

### INFO-1 — One EOA controls all three administrative roles
**Evidence:** live `owner()` on hub, `admin()` on mirror and `owner()` on reactive all return `0x199674cd60606A67E0Fa9fa28Ef00F58A33d2075`; both private-key variables in `.env` derive to that same address (compared via derived public address and a hash of the value; **key material was not printed**). `scripts/deploy.sh:16-17` nominally requires two keys but they are identical in practice.

A single key compromise permits: authorising any agent on the hub, redirecting the reactive callback recipient (`setDestinationMirror`), approving any module, and emergency-revoking any policy. **Fix:** use distinct deployer keys and multisig/smart-account owners for the three roles, as the code comments already recommend.

### INFO-2 — `deployed` strategy bucket is one-way
**File:** `contracts/src/GuardedDeFiVault.sol:119-120`

`rebalance` moves `holdings → deployed` and there is no inverse function. Owner `withdraw` (`:91-97`) can only return idle `holdings`, so tokens booked as `deployed` are permanently unavailable. This is a demo-accounting limitation, not an exploit. **Fix:** add an owner-only `undeploy(amount)` with the same CEI discipline if reversibility is intended.

### INFO-3 — Missing upper bound on `callbackGasLimit`
**File:** `contracts/src/ScopeCastReactive.sol:71-73`

Only the 100,000 lower bound is enforced; the documented 900,000 maximum is not. Live value is 800,000. **Fix:** add `if (callbackGasLimit_ > 900_000) revert GasLimitTooHigh();`.

### INFO-4 — `setModuleApproval` accepts `address(0)`
**File:** `contracts/src/PolicyMirror.sol:79-82`

Harmless with the current vault (which checks `destinationModule == address(this)`), but a zero-module policy could be stored as approved. **Fix:** reject `address(0)` when `approved_ == true`.

---

## Verified facts

1. `forge build` succeeded (lint notes only, no errors). `forge test -vvv`: **51 tests passed, 0 failed, 0 skipped** in 5 suites. Passing tests do not cover MEDIUM-1, MEDIUM-3, HIGH-1, HIGH-2 or MEDIUM-5.
2. `PolicyUpdated`'s topic0 was recomputed with `cast sig-event` and equals the hard-coded `0xd1601cdc…d8c9` in `PolicyHub.sol:33-44`, `ScopeCastReactive.sol:36`, `deploy.sh:23`, `IntegrationHarness.t.sol:21`.
3. Event ABI layout matches the decoder exactly: 3 indexed topics (`agentId`, `agent`, `epoch`) and 7 non-indexed fields decoded as `(uint256,address,bytes4,uint256,uint64,bool,bytes32)` at `ScopeCastReactive.sol:156-164`. Topic extraction uses `uint160(topic2)` and `uint64(topic3)` (`:151-152`), correct for ABI-encoded indexed address/uint64.
4. `opCode == 4` is correct for this event. `research/REACTIVE_TECHNICAL.md:189-198` quotes the official docs: "`opCode` is how many topics the original log had, so a `LOG3` arrives with `opCode` of `3`." Four topics ⇒ LOG4 ⇒ 4. All `opCode == 3` statements in the docs (LOW-5) are stale.
5. `PolicyHash.compute` (`src/interfaces/IScopecast.sol:37-62`) is a single shared `keccak256(abi.encode(...))` over all nine fields including `epoch` and `active`, and excludes the self-referential `policyHash`. Hub, reactive and mirror all use it; hash checks at `ScopeCastReactive.sol:170-181` and `PolicyMirror.sol:107-118` are consistent.
6. `react` is gated by `onlySystem` from the pinned `AbstractReactive` (`SYSTEM = 0x8888…8888`); `applyPolicy` is gated by **both** `onlyServiceProvider` and `onlyCallbackSender` (`PolicyMirror.sol:99`); `_CALLBACK_SENDER` and `_SERVICE_PROVIDER` are immutables in the pinned library. No on-chain auth bypass was found.
7. Payload shape is correct: `abi.encodeWithSignature(..., address(0), ...)` at `ScopeCastReactive.sol:189-204` reserves the first 160 bits for the network-injected reactive address, matching the documented rule (`research/REACTIVE_TECHNICAL.md:447-452`) and `PolicyMirror`'s first parameter.
8. Live read-only RPC checks (addresses from `docs/DEPLOYMENTS.md`, all reads succeeded):
   - Hub `owner()` = `0x199674…2075`; `expectedDestinationChainId()` = 1301; `expectedDestinationModule()` = vault `0x6AA0…2DBD`.
   - Reactive `originHub()` = hub `0xc8B5…6e4`; `destinationMirror()` = mirror `0xFd03…Cc64`; `expectedDestinationModule()` = vault; `owner()` = `0x199674…2075`; `callbackGasLimit()` = **800000**.
   - Mirror `_CALLBACK_SENDER()` = reactive `0x155c…98a3`; `_SERVICE_PROVIDER()` = official proxy `0x775c…6C1`; `admin()` = `0x199674…2075`; `approvedModule(vault)` = true.
   - Vault `mirror()` = mirror. Live `agentId 0x9d2bab63…9907`: hub policy epoch 2, `active=false`; reactive `latestRequestedEpoch` = 2; mirror `latestEpoch` = 2.
   - Mirror `reactiveSender()` does not exist (live call reverts), confirming MEDIUM-5.
9. No secret values were read out, printed or written during this audit; the two `.env` keys were compared only via derived public addresses and a truncated hash.

---

## Residual risks

- **Live network semantics cannot be proven locally.** `react` delivery ordering, callback retry behaviour, subscription persistence and the exact first-160-bit overwrite are emulated with `vm.etch` stubs; only the recorded three-chain receipts demonstrate them. I did not independently re-verify every historical hash in `docs/DEPLOYMENTS.md` — I spot-checked live getters and the gas limit only.
- **Harness blind spot (LOW-3).** A wrong mirror `_CALLBACK_SENDER` binding or a broken payload injection would still pass all 51 local tests.
- **Single-key operational control (INFO-1).** A compromise of `0x199674…2075` is equivalent to full policy control on all three chains; there is no timelock, multisig or pause path.
- **Silent desync (MEDIUM-1, MEDIUM-3).** Source and destination epochs are independent counters with no acknowledgement loop; divergence produces only a `StaleCallbackIgnored` event on the destination, which nothing currently monitors.
- **Test depth.** Fuzzing uses 256 runs (`foundry.toml:25-26`); no invariant tests exist despite the `[invariant]` block, and no Slither/Echidna/formal tooling was run within this scope. The mock mirror (`test/MockPolicyMirror.sol:11-13`) lets tests install arbitrary policies, so vault tests do not validate the real callback authorization path.
- **Documentation drift (LOW-5, MEDIUM-4).** Operators following `docs/CALLBACK_OPERATIONS.md` or `contracts/deployed-addresses.env` will be looking at a different (older) system than the one deployed.
- **Test asset only.** `MockAsset` is freely mintable and the vault moves tokens between internal accounting buckets; there is no real external DeFi integration or economic value at risk in the current deployment.

---

## Commands executed and exact results

```
$ cd contracts && forge build
# Compiler run successful; forge-lint notes only (screaming-snake-case immutable,
# unwrapped-modifier-logic). No errors.

$ cd contracts && forge test -vvv
No files changed, compilation skipped
Ran 11 tests for test/ScopeCastReactive.t.sol:ScopeCastReactiveTest  — 11 passed
Ran 1 test  for test/IntegrationHarness.t.sol:IntegrationHarnessTest — 1 passed
Ran 13 tests for test/GuardedDeFiVault.t.sol:GuardedDeFiVaultTest     — 13 passed
Ran 14 tests for test/PolicyHub.t.sol:PolicyHubTest                  — 14 passed
Ran 12 tests for test/PolicyMirror.t.sol:PolicyMirrorTest            — 12 passed
Ran 5 test suites in 81.01ms (193.00ms CPU time): 51 tests passed, 0 failed, 0 skipped (51 total tests)
```
