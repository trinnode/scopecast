# SCOPECAST — Deployments and verified evidence

> **STRICT WARNING — fill only from verified RPC receipts.** Do not copy an address or hash from a
> chat message, a screenshot, a build spec, a local test log or another project. Do not write a
> value into this file until an independent `eth_getTransactionReceipt` / explorer lookup on the
> correct chain confirms it. Until then every unknown is exactly `<PENDING_DEPLOY>` (address) or
> `<PENDING_TX>` (hash), and no propagation stage is considered complete.
>
> The web console currently reads `apps/web/public/evidence/flow.json` with `verified: false`: it
> shows `UNKNOWN` / `DESTINATION_SYNC_UNKNOWN` and labels local runs `SIMULATION`. Local Foundry
> tests (including `IntegrationHarness.t.sol`, which stubs the system contract and callback proxy)
> are **simulation only** and must never be presented as a live callback.

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

## 3. Deployed contracts — placeholders

Fill **each cell** from its own deployment receipt and `eth_getCode` response. Record the deployer
address and nonce alongside each entry so the predicted-address bootstrap can be audited.

| Contract | Chain | Address | Deployment tx hash | Verified via |
| --- | --- | --- | --- | --- |
| `PolicyHub` | Base Sepolia (84532) | `<PENDING_DEPLOY>` | `<PENDING_TX>` | `eth_getCode`, `owner()`, `expectedDestinationChainId()`, `expectedDestinationModule()` |
| `ScopeCastReactive` | Reactive Lasna (5318007) | `<PENDING_DEPLOY>` | `<PENDING_TX>` | `eth_getCode`, `originHub()`, `destinationMirror()`, `callbackGasLimit()` |
| `PolicyMirror` | Unichain Sepolia (1301) | `<PENDING_DEPLOY>` | `<PENDING_TX>` | `eth_getCode`, `_CALLBACK_SENDER`, `_SERVICE_PROVIDER`, `admin()` |
| `GuardedDeFiVault` | Unichain Sepolia (1301) | `<PENDING_DEPLOY>` | `<PENDING_TX>` | `eth_getCode`, `mirror()`, `asset()` |
| `MockAsset` | Unichain Sepolia (1301) | `<PENDING_DEPLOY>` | `<PENDING_TX>` | `eth_getCode`, `symbol()` |

Constructor verification commands (replace the placeholder names with the verified addresses only
after receipt confirmation):

```bash
cast call "$POLICY_HUB_ADDRESS" "expectedDestinationChainId()(uint256)" --rpc-url "$BASE_RPC_URL"
cast call "$POLICY_HUB_ADDRESS" "expectedDestinationModule()(address)" --rpc-url "$BASE_RPC_URL"
cast call "$REACTIVE_CONTRACT_ADDRESS" "originHub()(address)" --rpc-url "$LASNA_RPC_URL"
cast call "$REACTIVE_CONTRACT_ADDRESS" "policyTopic0()(uint256)" --rpc-url "$LASNA_RPC_URL"
cast call "$REACTIVE_CONTRACT_ADDRESS" "destinationMirror()(address)" --rpc-url "$LASNA_RPC_URL"
cast call "$POLICY_MIRROR_ADDRESS" "_CALLBACK_SENDER()(address)" --rpc-url "$UNICHAIN_RPC_URL"
cast call "$POLICY_MIRROR_ADDRESS" "_SERVICE_PROVIDER()(address)" --rpc-url "$UNICHAIN_RPC_URL"
cast call "$GUARDED_VAULT_ADDRESS" "mirror()(address)" --rpc-url "$UNICHAIN_RPC_URL"
```

## 4. Subscription

| Item | Value |
| --- | --- |
| Subscriber | `ScopeCastReactive` at `<PENDING_DEPLOY>` |
| Origin chain | 84532 |
| Origin contract | `PolicyHub` at `<PENDING_DEPLOY>` |
| topic0 | `0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9` |
| topic1 / topic2 / topic3 | `REACTIVE_IGNORE` / `REACTIVE_IGNORE` / `REACTIVE_IGNORE` (wildcards; filter is topic0-specific) |
| Subscription tx | `<PENDING_TX>` (created inside the reactive constructor) |
| Confirmation | `<PENDING_DEPLOY>` (confirm with Reactive MCP `list_subscriptions` / `validate_subscription`) |

## 5. Flow evidence — hashes

Every row must come from `cast receipt` on the named chain. A request event is **not** a callback
receipt.

| Stage | Chain | Hash | Receipt status / block | Timestamp |
| --- | --- | --- | --- | --- |
| Grant — source `createPolicy` | Base Sepolia | `<PENDING_TX>` | `<PENDING_DEPLOY>` | `<PENDING_DEPLOY>` |
| Grant — reactive `react()` / `PolicyAccepted` | Lasna | `<PENDING_TX>` | `<PENDING_DEPLOY>` | `<PENDING_DEPLOY>` |
| Grant — destination `applyPolicy` | Unichain Sepolia | `<PENDING_TX>` | `<PENDING_DEPLOY>` | `<PENDING_DEPLOY>` |
| Allowed agent action (pre-revoke) | Unichain Sepolia | `<PENDING_TX>` | `<PENDING_DEPLOY>` | `<PENDING_DEPLOY>` |
| Revoke — source `revokePolicy` | Base Sepolia | `<PENDING_TX>` | `<PENDING_DEPLOY>` | `<PENDING_DEPLOY>` |
| Revoke — reactive `react()` / `PolicyAccepted` | Lasna | `<PENDING_TX>` | `<PENDING_DEPLOY>` | `<PENDING_DEPLOY>` |
| Revoke — destination `applyPolicy` | Unichain Sepolia | `<PENDING_TX>` | `<PENDING_DEPLOY>` | `<PENDING_DEPLOY>` |
| Same agent action after revoke | Unichain Sepolia | `<PENDING_TX>` (revert) or labelled `eth_call` simulation | `<PENDING_DEPLOY>` | `<PENDING_DEPLOY>` |

Measured propagation (source receipt timestamp → destination receipt timestamp):
`<PENDING_DEPLOY>` ms; method: `<PENDING_DEPLOY>` (state explicitly how the two timestamps were
obtained). Do not claim instant or atomic revocation.

```bash
cast receipt "$SOURCE_TX" --rpc-url "$BASE_RPC_URL"
cast receipt "$REACTIVE_TX" --rpc-url "$LASNA_RPC_URL"
cast receipt "$CALLBACK_TX" --rpc-url "$UNICHAIN_RPC_URL"
cast logs --address "$POLICY_HUB_ADDRESS" \
  'PolicyUpdated(bytes32,address,uint64,uint256,address,bytes4,uint256,uint64,bool,bytes32)' \
  --rpc-url "$BASE_RPC_URL"
cast logs --address "$POLICY_MIRROR_ADDRESS" 'PolicyMirrored(bytes32,uint64,address,bool,bytes32,address)' \
  --rpc-url "$UNICHAIN_RPC_URL"
```

## 6. Funding state

| Item | Value | Update rule |
| --- | --- | --- |
| Reactive lREACT balance | `<PENDING_DEPLOY>` | From `cast balance` on Lasna at a stated block |
| Reactive debt | `<PENDING_DEPLOY>` | From `debt(address)` on `0x8888…8888` |
| Mirror SepETH reserve | `<PENDING_DEPLOY>` | From `cast balance` on Unichain Sepolia |
| Mirror callback debt | `<PENDING_DEPLOY>` | From `debt(address)` on `0x775c…6C1` |
| Callback gas limit in deployment | `<PENDING_DEPLOY>` | From the constructor argument in the verified deployment receipt; must be >= 100000 and <= 900000 |

## 7. Console evidence gate

`apps/web/public/evidence/flow.json` starts as:

```json
{
  "verified": false,
  "note": "No verified on-chain flow evidence has been recorded yet. Local simulations are not proof of a live callback. This file is updated only from independently checked RPC receipts."
}
```

Keep `verified: false` until the complete three-chain receipt set above exists. The console then
shows `UNKNOWN` and `DESTINATION_SYNC_UNKNOWN` for values it cannot independently verify, and marks
the route `SIMULATION`. Never flip this flag from a local test or from a callback request event.
