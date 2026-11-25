# SCOPECAST — Callback operations

> Testnet-only. All deployed values are `<PENDING_DEPLOY>` until confirmed from a verified RPC
> receipt. Callback success means a **confirmed destination receipt**, never merely a
> `CallbackRequest` or a request made by `react()`.

## 1. Network constants

| Item | Value | Role |
| --- | --- | --- |
| Reactive system contract (Lasna and Reactive Mainnet) | `0x8888888888888888888888888888888888888888` | Subscription service, callback request service, `onlySystem` gate, `debt(address)` |
| Base Sepolia callback proxy | `0x476F44b11F5C942c58f4c8E3d0300E5710743585` | Published origin/destination proxy; not used by SCOPECAST's source-side flow |
| Unichain Sepolia callback proxy | `0x775c9B990ADe401060B78D0e98684eEf8d2466C1` | Only gateway allowed to call `PolicyMirror.applyPolicy` |
| `PolicyUpdated` topic0 | `0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9` | Subscription topic; `keccak256` of the exact event signature |
| Minimum callback gas | `100000` | Requests below this are ignored by the system contract; enforced in `ScopeCastReactive`'s constructor |
| Reactive transaction gas cap | `900000` | Hard network cap; the callback gas limit is part of the same budget |
| Configured callback gas limit | `<PENDING_DEPLOY>` | Immutable after deployment; local harness uses `300000` |

The callback receiver (`PolicyMirror`) pays for destination execution in **Unichain Sepolia native
ETH**, not in REACT/lREACT. A failed callback is still charged; a recipient in debt receives nothing.
A callback to an address with no code is rejected before charging.

## 2. Funding model

### 2.1 Reactive execution balance (lREACT, Lasna)

`ScopeCastReactive` needs lREACT on Lasna to execute `react()` transactions. Obtain it from the
official faucet: send SepETH to the Base Sepolia faucet address
`0x2afaFD298b23b62760711756088F75B7409f5967`; `1 ETH → 100 lREACT`, maximum `5 ETH` per
transaction. Verify the current faucet instructions before use.

```bash
cast send 0x2afaFD298b23b62760711756088F75B7409f5967 --value 100000000000000000 \
  --rpc-url "$BASE_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"
cast balance "$REACTIVE_CONTRACT_ADDRESS" --rpc-url "$LASNA_RPC_URL"
cast call 0x8888888888888888888888888888888888888888 "debt(address)(uint256)" \
  "$REACTIVE_CONTRACT_ADDRESS" --rpc-url "$LASNA_RPC_URL"
```

Top up with a plain value transfer to the reactive address (the library's `receive()` is payable):

```bash
cast send "$REACTIVE_CONTRACT_ADDRESS" --value 1000000000000000 \
  --rpc-url "$LASNA_RPC_URL" --private-key "$REACTIVE_DEPLOYER_PRIVATE_KEY"
```

The current `ScopeCastReactive` source does **not** expose a public `coverDebt()` wrapper, so an
operator cannot explicitly clear reactive-side debt. Fund proactively; if debt becomes persistent,
the contract must be redeployed with a wrapper (which requires re-bootstrap because of immutable
addresses).

### 2.2 Destination reserve (SepETH, Unichain Sepolia)

`PolicyMirror` needs native ETH on Unichain Sepolia to pay callback gas. Keep a reserve above the
expected cost of a burst of callbacks. Monitor the balance and the proxy's debt view:

```bash
cast balance "$POLICY_MIRROR_ADDRESS" --rpc-url "$UNICHAIN_RPC_URL"
cast call 0x775c9B990ADe401060B78D0e98684eEf8d2466C1 "debt(address)(uint256)" \
  "$POLICY_MIRROR_ADDRESS" --rpc-url "$UNICHAIN_RPC_URL"
```

## 3. Debt and `coverDebt`

`AbstractPayer` exposes `debt(address)` on the service provider and an internal `_coverDebt()` that
reads that debt and pays it from the callback contract's own native balance. `PolicyMirror` exposes a
public, unpermissioned `coverDebt()` wrapper. It can be called by anyone, but it only spends the
mirror's own balance, so it does not create an authorisation issue.

```bash
# Fund first, then clear debt; insufficient balance reverts InsufficientFunds.
cast send "$POLICY_MIRROR_ADDRESS" --value 1000000000000000 \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"
cast send "$POLICY_MIRROR_ADDRESS" "coverDebt()" \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"
cast call 0x775c9B990ADe401060B78D0e98684eEf8d2466C1 "debt(address)(uint256)" \
  "$POLICY_MIRROR_ADDRESS" --rpc-url "$UNICHAIN_RPC_URL"
```

A `CallbackFailure` event means the callback was attempted and charged; investigate the reason
(wrong immutable sender, unapproved module, hash mismatch, out of gas, or debt) rather than assuming
it will be retried.

## 4. Debugging checklist

Work through the three chains in order; stop at the first missing link.

1. **Source event.** Confirm the source receipt and the `PolicyUpdated` log fields (epoch, active,
   policyHash, destination chain/module). The hub emits three indexed fields, so `opCode` is 3.
   ```bash
   cast receipt "$SOURCE_TX" --rpc-url "$BASE_RPC_URL"
   cast logs --address "$POLICY_HUB_ADDRESS" \
     'PolicyUpdated(bytes32,address,uint64,uint256,address,bytes4,uint256,uint64,bool,bytes32)' \
     --rpc-url "$BASE_RPC_URL"
   ```
2. **Subscription.** The subscription is created in the reactive constructor with
   `(84532, hub, topic0, REACTIVE_IGNORE × 3)` and cannot be changed at runtime. If it was created
   with a wrong hub/topic, or was lost, redeploy the reactive contract and re-bootstrap.
3. **Reactive processing.** Look for `PolicyAccepted` on Lasna. Absence means a filter rejected the
   log (wrong chain, emitter, topic, opCode, zero indexed value, wrong destination module/chain,
   zero selector/cap, or hash mismatch) or `epoch <= latestRequestedEpoch[agentId]`.
   ```bash
   cast logs --address "$REACTIVE_CONTRACT_ADDRESS" \
     'PolicyAccepted(bytes32,uint64,bool,bytes32,uint256,bytes)' --rpc-url "$LASNA_RPC_URL"
   cast call "$REACTIVE_CONTRACT_ADDRESS" "latestRequestedEpoch(bytes32)(uint64)" "$AGENT_ID" \
     --rpc-url "$LASNA_RPC_URL"
   ```
4. **Callback receipt.** A request is not delivery. Find the Unichain transaction from the callback
   proxy to `PolicyMirror` and require a successful receipt.
   ```bash
   cast receipt "$CALLBACK_TX" --rpc-url "$UNICHAIN_RPC_URL"
   ```
5. **Mirror outcome.** `PolicyMirrored` means state applied; `StaleCallbackIgnored` means the epoch
   was already stored; no event plus a `CallbackFailure` on the proxy means the callback reverted.
   ```bash
   cast call "$POLICY_MIRROR_ADDRESS" "latestEpoch(bytes32)(uint64)" "$AGENT_ID" \
     --rpc-url "$UNICHAIN_RPC_URL"
   cast call "$POLICY_MIRROR_ADDRESS" "getPolicy(bytes32)" "$AGENT_ID" \
     --rpc-url "$UNICHAIN_RPC_URL"
   ```
6. **Enforcement.** Only then test `GuardedDeFiVault.rebalance` with the agent key. A rejection is
   evidence that the guard works, not that propagation failed — inspect the custom error.
7. **Reserves.** Check both balances and both `debt(address)` views (§2). A recipient in debt
   receives no callback.

Official diagnostic tooling: the Reactive MCP endpoint is `https://mcp.rnk.dev/mcp` (public, HTTP
POST; `GET` returns 405). Use it for subscription/health diagnosis; it does not replace RPC receipt
verification.

## 5. Retry procedure

There is no automatic retry of a consumed epoch:

- `ScopeCastReactive.latestRequestedEpoch[agentId]` is set when the callback is **requested**, not
  when it is delivered. A later delivery of the same log is filtered out.
- `PolicyMirror` is idempotent, so a repeated delivery of an epoch it already stored is harmless
  (`StaleCallbackIgnored`), but it also cannot re-apply a failed callback.

Recovery options, in order:

1. **Transient destination failure (debt / low reserve):** top up the mirror, call `coverDebt()`,
   verify `debt(address)` returns zero, then create a **new owner-authorised source mutation** at a
   higher epoch (`updatePolicy`, or `revokePolicy` followed by `updatePolicy`). The new log passes
   the watermark and produces a fresh callback. Do not edit epoch values by hand.
2. **Immediate containment needed:** call `emergencyRevoke(agentId)` from the destination admin. It
   sets `active=false` and advances the local epoch; a later source re-grant must use an epoch above
   that local value to take effect.
3. **Wrong immutable configuration** (wrong hub, mirror, module, topic0, proxy or authorised
   reactive sender): no recovery short of redeploying the affected contract(s) and repeating the
   predicted-address bootstrap in `RUNBOOK.md` §2.
4. **Lost subscription:** the reactive contract has no runtime `subscribe`/`unsubscribe` helper;
   redeploy with the correct constructor arguments and re-bootstrap.

## 6. Decision table

| Observation | Interpretation | Action |
| --- | --- | --- |
| Source log exists, no `PolicyAccepted` | Reactive filter rejected the log or subscription is wrong/dead | Check filters and subscription; redeploy if misconfigured |
| `PolicyAccepted` exists, no Unichain receipt | Callback requested but not delivered | Check reserves/debt; then publish a higher source epoch |
| Unichain receipt reverted with `CallbackNotAuthorized` | Injected sender is not the immutable reactive address | Wrong constructor address — redeploy mirror |
| Reverted with `NotAuthorized` | Caller was not the official callback proxy | Wrong constructor proxy — redeploy mirror |
| Reverted with `BadPolicyHash` / `WrongDestinationChain` / `ModuleNotApproved` | Payload/state mismatch | Verify hub immutables and `setModuleApproval` |
| `StaleCallbackIgnored` with a lower received epoch | Expected duplicate/out-of-order delivery | No action; confirm stored epoch |
| Mirror epoch advanced, vault still rejects with a policy error | Policy scope, not propagation, is the cause | Compare `getPolicy` fields with the vault's checks |

Never mark the propagation stage complete in the console or submission without a verified receipt on
all three chains. Until then the UI shows `UNKNOWN` / `DESTINATION_SYNC_UNKNOWN` and labels local runs
`SIMULATION`.
