# SCOPECAST — Deployments and verified evidence

> **Evidence discipline.** Every address and hash in this file was independently confirmed with
> `eth_getTransactionReceipt` / `eth_getCode` on its own chain on 2026-11-25. Unknown values are
> written as `null` or "not recorded", never inferred. The console reads
> `apps/web/public/evidence/flow.json`, which is now `verified: true`; stages without a verified
> receipt still render `UNKNOWN`. Local Foundry tests, including `IntegrationHarness.t.sol` (which
> stubs the system contract and callback proxy with `vm.etch`), are labelled **simulation** and are
> never presented as a live callback.

## 1. Chains and endpoints

| Network | Role | Chain ID | RPC | Explorer | Currency |
| --- | --- | ---: | --- | --- | --- |
| Base Sepolia | Origin: `PolicyHub`, lREACT faucet | 84532 | `https://base-sepolia-rpc.publicnode.com` | `https://sepolia.basescan.org` | SepETH |
| Reactive Lasna (Omni testnet) | Reaction: `ScopeCastReactive` | 5318007 | `https://lasna-rpc.rnk.dev/` | `https://lasna.reactscan.net` | lREACT |
| Unichain Sepolia | Destination: `PolicyMirror`, `GuardedDeFiVault`, `MockAsset` | 1301 | `https://sepolia.unichain.org` | `https://sepolia.uniscan.xyz` | SepETH |

Lasna RPC may require the documented DNS workaround (`--resolve lasna-rpc.rnk.dev:443:137.74.125.148`).
Recheck official endpoints before every deployment; testnet parameters can change.

## 2. Published network constants (verified 2026-11-25)

| Constant | Value | Verified how |
| --- | --- | --- |
| Reactive system contract (Lasna) | `0x8888888888888888888888888888888888888888` | `eth_getCode` present, 478 bytes, EIP-1967 proxy |
| Base Sepolia callback proxy | `0x476F44b11F5C942c58f4c8E3d0300E5710743585` | `eth_getCode` present, 436 bytes, EIP-1967 proxy |
| Unichain Sepolia callback proxy | `0x775c9B990ADe401060B78D0e98684eEf8d2466C1` | `eth_getCode` present, 436 bytes, EIP-1967 proxy |
| `PolicyUpdated` topic0 | `0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9` | `cast sig-event` matches the compiled event signature |
| Reactive library | `reactive-lib-omni` v0.1.0, commit `3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8` | vendored in `contracts/lib/reactive-lib/` |
| Compiler / EVM | Solidity `0.8.29`, `cancun` | `contracts/foundry.toml` |

Raw chain checks are in `research/REACTIVE_VERIFICATION.txt`; source mapping is in
`research/SOURCES_REACTIVE.md` and `research/REACTIVE_TECHNICAL.md` §8–9.

Verify before trusting:

```bash
cast chain-id --rpc-url "$BASE_RPC_URL"     # 84532
cast chain-id --rpc-url "$UNICHAIN_RPC_URL" # 1301
cast chain-id --rpc-url "$LASNA_RPC_URL"    # 5318007
cast code 0x8888888888888888888888888888888888888888 --rpc-url "$LASNA_RPC_URL"
cast code 0x775c9B990ADe401060B78D0e98684eEf8d2466C1 --rpc-url "$UNICHAIN_RPC_URL"
```

## 3. Deployed contracts — verified 2026-11-25

All addresses and hashes below were read back from their own chain RPC. The final Reactive contract
uses an **800,000** callback gas limit: the callback proxy subtracts significant overhead, and a
300,000 limit left the receiver with only ~120,000 gas, which reverted with "not enough gas for
reentrancy sentry". The receiver needs ~190,000 gas.

| Contract | Chain | Address | Verified via |
| --- | --- | --- | --- |
| `PolicyHub` | Base Sepolia (84532) | `0xc8B5A34BC6791138d107E1348A24bB7c27C766e4` | `expectedDestinationChainId()=1301`, `expectedDestinationModule()=vault` |
| `ScopeCastReactive` | Reactive Lasna (5318007) | `0x155c0CbEdfBA688974A7354D39797c09667f98a3` | deploy `0x3e67b3ae34e9db016bfd4c6b46db8f80ff66ae51cf10ee269b0b5f75a046f9d4`; `policyTopic0()`, `destinationMirror()`, `callbackGasLimit()=800000`, `debt()=0` verified |
| `PolicyMirror` | Unichain Sepolia (1301) | `0xFd036Ad562A612cEF82db4893558C09bBA8664D8` | `_CALLBACK_SENDER()=reactive`, `_SERVICE_PROVIDER()=proxy`, `admin()`, module approved, balance 0.0001 ETH |
| `GuardedDeFiVault` | Unichain Sepolia (1301) | `0x6AA08fD4C41D4e66CC27f654bE4f8f0e71029DBD` | `mirror()=PolicyMirror`, `asset()`, seeded 50 test units |
| `MockAsset` | Unichain Sepolia (1301) | `0xcfF438ec5B4AB5Afef185D5C2b270c9fFFF5fc8e` | `eth_getCode`, `symbol()=SCT` |

Earlier deployment attempts on Lasna used placeholder configurations and are superseded; only the
addresses above are referenced by the running system.

## 4. Subscription

| Item | Value |
| --- | --- |
| Subscriber | `0x155c0CbEdfBA688974A7354D39797c09667f98a3` |
| Origin chain | 84532 |
| Origin contract | `0xc8B5A34BC6791138d107E1348A24bB7c27C766e4` |
| topic0 | `0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9` |
| topic1 / topic2 / topic3 | `REACTIVE_IGNORE` × 3 (wildcards; topic0 is the specific filter) |
| Subscription tx | `0x76fee123c7d093e49b23d82505e3b133daef69327a54aca2447e53c14c21d476` (`configure`) and the later reconfigure `0x2fe60792573efdc828e32b04e32ae184b7d49630f491a752a958490ed61da12f` |
| Confirmation | `Subscribe` and `Unsubscribe` events present in the system contract receipt; delivery proven by the `react()` transactions below |

## 5. Flow evidence — hashes

Every hash below was checked with `eth_getTransactionReceipt` on its own chain. A request event is
not a callback receipt. Post-revoke denial is an `eth_call` simulation, not a reverted transaction.

| Stage | Chain | Hash |
| --- | --- | --- |
| Grant — source `createPolicy` | Base Sepolia | `0xb8d1c99253cf7b7c737878abf0862a372aaee8db64f918ccc94c84a9e61c083a` |
| Grant — reactive `react()` / `PolicyAccepted` | Lasna | `0xb7ba1b7abbb21e87d97a65f445e761957be5b8acaa573432bf7e5aa869c8a1e3` |
| Grant — destination `applyPolicy` callback | Unichain Sepolia | `0xc42a91950fa0005bd8576a73c34c2811dbe1f726f0827bc0cb10803eeeafa73c` |
| Allowed agent action (pre-revoke) | Unichain Sepolia | `0x5aba6e8332a4a705278893d1f68c388c1ecd9b5dbd6df350c278809167453cf4` |
| Revoke — source `revokePolicy` | Base Sepolia | `0xff1505decd47016664421af80d15369eb5b4817204ebe11dcfdce780eeafc25d` |
| Revoke — reactive `react()` | Lasna | `0x26f412c5179d8413de903a61ccad55caae5f2addf84a9ffa5199af62cb331b91` |
| Revoke — destination callback | Unichain Sepolia | `0x97d2a79dac850272906e637b2bc8862a39aa97b985c6fd0c9055428d0a540112` |
| Post-revoke denial | Unichain Sepolia | `eth_call` simulation, revert selector `0x5aff86e7` (`AgentPolicyInactive`) |

Observed source-to-destination propagation: **3,000 ms**, measured as destination block timestamp
minus source block timestamp from the two verified receipts (revoke path).

## 6. Funding state

| Item | Value | Evidence |
| --- | --- | --- |
| Reactive lREACT balance | 0 debt after `depositTo` of 0.3 lREACT | `debt(address)` on Lasna system contract returned 0 |
| Reactive callback gas limit | 800000 | `callbackGasLimit()` on the deployed Reactive contract |
| Mirror SepETH reserve | 0.0001 ETH | `cast balance` on Unichain Sepolia |
| Post-run mirror reserve | ~0.0000997 ETH | `cast balance` after callback charges |
| Module approval | `true` | `approvedModule(vault)` on `PolicyMirror` |

## 7. Console evidence gate

`apps/web/public/evidence/flow.json` starts as:

```json
{
  "verified": false,
  "note": "No verified on-chain flow evidence has been recorded yet. Local simulations are not proof of a live callback. This file is updated only from independently checked RPC receipts."
}
```

The complete three-chain receipt set above exists and `verified: true`. The console then
shows `UNKNOWN` and `DESTINATION_SYNC_UNKNOWN` for values it cannot independently verify, and marks
the route `SIMULATION`. Never flip this flag from a local test or from a callback request event.
