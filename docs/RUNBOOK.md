# SCOPECAST — Runbook

> Testnet only. Commands use **environment variable names only**; never paste a private key or RPC
> secret into a command, file, screenshot or report. All live values are recorded only from verified
> RPC receipts in `DEPLOYMENTS.md`. Until then, deployed addresses are `<PENDING_DEPLOY>` and hashes
> are `<PENDING_TX>`. `forge test` is a local simulation, not proof of a live callback.

## 0. Environment variables

Public (safe to expose; names match `.env.example`):

| Variable | Meaning |
| --- | --- |
| `$BASE_RPC_URL`, `$UNICHAIN_RPC_URL`, `$LASNA_RPC_URL` | RPC endpoints for the three chains |
| `$POLICY_HUB_ADDRESS`, `$REACTIVE_CONTRACT_ADDRESS`, `$POLICY_MIRROR_ADDRESS`, `$GUARDED_VAULT_ADDRESS`, `$TOKEN_ADDRESS` | Deployed addresses (fill from receipts) |
| `$BASE_EXPLORER_URL`, `$UNICHAIN_EXPLORER_URL`, `$REACTSCAN_URL` | Explorers |

Secrets / operational inputs (never commit values):

| Variable | Meaning |
| --- | --- |
| `$DEPLOYER_PRIVATE_KEY` | Testnet deployer/owner key for Base Sepolia and Unichain Sepolia (`.env.example`) |
| `$REACTIVE_DEPLOYER_PRIVATE_KEY` | Testnet deployer/owner key for Lasna (`.env.example`) |
| `$AGENT_SESSION_PRIVATE_KEY` | Ephemeral test agent key; do not persist |
| `$UNICHAIN_DEPLOYER_ADDRESS`, `$BASE_DEPLOYER_ADDRESS`, `$LASNA_DEPLOYER_ADDRESS` | Deployer addresses used for nonce prediction |
| `$UNICHAIN_ADMIN_ADDRESS` | Destination emergency admin (multisig in production) |
| `$ASSET_NONCE`, `$VAULT_NONCE`, `$MIRROR_NONCE`, `$HUB_NONCE`, `$REACTIVE_NONCE` | Exact deployer nonces at prediction time |
| `$PREDICTED_ASSET_ADDRESS`, `$PREDICTED_VAULT_ADDRESS`, `$PREDICTED_MIRROR_ADDRESS`, `$PREDICTED_HUB_ADDRESS`, `$PREDICTED_REACTIVE_ADDRESS` | Predicted CREATE addresses |
| `$TOPIC0`, `$CALLBACK_GAS_LIMIT`, `$AGENT_ID`, `$AGENT_ADDRESS`, `$SELECTOR`, `$CAP_WEI`, `$EXPIRY`, `$AMOUNT_WEI` | Policy parameters |
| `$TX_HASH`, `$SOURCE_TX`, `$REACTIVE_TX`, `$CALLBACK_TX` | Receipt hashes under verification |

Fixed constants (published, not secrets):

```
BASE_CHAIN_ID       = 84532
UNICHAIN_CHAIN_ID   = 1301
LASNA_CHAIN_ID      = 5318007
SYSTEM_CONTRACT     = 0x8888888888888888888888888888888888888888
BASE_CALLBACK_PROXY = 0x476F44b11F5C942c58f4c8E3d0300E5710743585
UNI_CALLBACK_PROXY  = 0x775c9B990ADe401060B78D0e98684eEf8d2466C1
TOPIC0              = 0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9
CALLBACK_GAS_MIN    = 100000
REACTIVE_GAS_CAP    = 900000
LREACT_FAUCET       = 0x2afaFD298b23b62760711756088F75B7409f5967 (Base Sepolia)
```

## 1. Preflight verification

Confirm each chain ID and the deployed bytecode of the system contract and proxy before deploying.
Do not trust an address merely because it appears in a document.

```bash
cast chain-id --rpc-url "$BASE_RPC_URL"     # expect 84532
cast chain-id --rpc-url "$UNICHAIN_RPC_URL" # expect 1301
cast chain-id --rpc-url "$LASNA_RPC_URL"    # expect 5318007

cast code 0x476F44b11F5C942c58f4c8E3d0300E5710743585 --rpc-url "$BASE_RPC_URL"
cast code 0x775c9B990ADe401060B78D0e98684eEf8d2466C1 --rpc-url "$UNICHAIN_RPC_URL"
cast code 0x8888888888888888888888888888888888888888 --rpc-url "$LASNA_RPC_URL"

curl -s -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  "$BASE_RPC_URL"
```

Lasna RPC may need the documented DNS workaround:

```bash
curl -s --resolve lasna-rpc.rnk.dev:443:137.74.125.148 \
  -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://lasna-rpc.rnk.dev/
```

Local build and test (simulation only):

```bash
cd contracts && forge build && forge test -vvv
```

## 2. Deploy with owner-only bootstrap

The implemented contracts resolve the address cycle with `ScopeCastReactive.configure(hub, module,
mirror)` — an owner-only function that re-subscribes to the real hub. No CREATE-address prediction is
required. `bash scripts/deploy.sh` performs the whole sequence automatically from `.env`:

| Step | Chain | Action |
| --- | --- | --- |
| 1 | Lasna | Deploy `ScopeCastReactive` with non-zero placeholder hub/module/mirror; constructor subscribes to placeholder |
| 2 | Unichain Sepolia | Deploy `PolicyMirror` with the **actual** reactive address, official callback proxy, admin, `initialModule = 0` |
| 3 | Unichain Sepolia | Deploy `MockAsset` and `GuardedDeFiVault(mirror, asset)` |
| 4 | Unichain Sepolia | Admin calls `setModuleApproval(vault, true)` |
| 5 | Base Sepolia | Deploy `PolicyHub(1301, vault)` |
| 6 | Lasna | Owner calls `configure(hub, vault, mirror)`; verify `originHub()`, `destinationMirror()` and subscription |

```bash
bash scripts/deploy.sh
```

The script verifies each chain ID before deploying, captures every address from `forge create --json`,
and writes the public addresses to `deployed-addresses.env`. It never prints a private key.

Manual equivalents, if needed:

```bash
cd contracts
forge create src/ScopeCastReactive.sol:ScopeCastReactive \
  --constructor-args 84532 0x0000000000000000000000000000000000000001 "$TOPIC0" 1301 \
  0x0000000000000000000000000000000000000001 "$CALLBACK_GAS_LIMIT" \
  --rpc-url "$LASNA_RPC_URL" --private-key "$REACTIVE_DEPLOYER_PRIVATE_KEY" --broadcast

forge create src/PolicyMirror.sol:PolicyMirror \
  --constructor-args 0x775c9B990ADe401060B78D0e98684eEf8d2466C1 \
  "$REACTIVE_CONTRACT_ADDRESS" "$UNICHAIN_ADMIN_ADDRESS" \
  0x0000000000000000000000000000000000000000 \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY" --broadcast

cast send "$REACTIVE_CONTRACT_ADDRESS" 'configure(address,address,address)' \
  "$POLICY_HUB_ADDRESS" "$GUARDED_VAULT_ADDRESS" "$POLICY_MIRROR_ADDRESS" \
  --rpc-url "$LASNA_RPC_URL" --private-key "$REACTIVE_DEPLOYER_PRIVATE_KEY"
```

## 3. Configure, grant module approval, fund

Each command below must be confirmed from a receipt before the next step.

```bash
# Reactive owner points callbacks at the deployed mirror (immutable cycle resolved).
cast send "$REACTIVE_CONTRACT_ADDRESS" "setDestinationMirror(address)" "$POLICY_MIRROR_ADDRESS" \
  --rpc-url "$LASNA_RPC_URL" --private-key "$REACTIVE_DEPLOYER_PRIVATE_KEY"

# Destination admin approves the guarded module as a callback target.
cast send "$POLICY_MIRROR_ADDRESS" "setModuleApproval(address,bool)" "$GUARDED_VAULT_ADDRESS" true \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"

# Seed the vault with test units (owner only; the asset must be approved to the vault first).
cast send "$TOKEN_ADDRESS" "approve(address,uint256)" "$GUARDED_VAULT_ADDRESS" "$CAP_WEI" \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"
cast send "$GUARDED_VAULT_ADDRESS" "seed(uint256)" "$CAP_WEI" \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"

# Obtain lREACT on Lasna: send SepETH to the Base Sepolia faucet (1 ETH -> 100 lREACT, max 5 ETH/tx).
cast send 0x2afaFD298b23b62760711756088F75B7409f5967 --value 100000000000000000 \
  --rpc-url "$BASE_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"

# Fund the callback receiver with Unichain Sepolia native ETH (receiver pays callback gas).
cast send "$POLICY_MIRROR_ADDRESS" --value 1000000000000000 \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"
```

Verify configuration:

```bash
cast call "$POLICY_HUB_ADDRESS" "owner()(address)" --rpc-url "$BASE_RPC_URL"
cast call "$POLICY_HUB_ADDRESS" "expectedDestinationChainId()(uint256)" --rpc-url "$BASE_RPC_URL"
cast call "$POLICY_HUB_ADDRESS" "expectedDestinationModule()(address)" --rpc-url "$BASE_RPC_URL"
cast call "$REACTIVE_CONTRACT_ADDRESS" "destinationMirror()(address)" --rpc-url "$LASNA_RPC_URL"
cast call "$REACTIVE_CONTRACT_ADDRESS" "callbackGasLimit()(uint64)" --rpc-url "$LASNA_RPC_URL"
cast call "$POLICY_MIRROR_ADDRESS" "approvedModule(address)(bool)" "$GUARDED_VAULT_ADDRESS" \
  --rpc-url "$UNICHAIN_RPC_URL"
```

Record every verified address and hash in `DEPLOYMENTS.md` with the exact receipt used.

## 4. Grant / update / revoke

Use the vault's actual selector, `rebalance(bytes32,uint256)`. A policy authored with
`rebalance(uint256)` will be rejected by the vault (`WrongSelector`).

```bash
# Grant (source epoch 1).
cast send "$POLICY_HUB_ADDRESS" \
  "createPolicy(bytes32,address,bytes4,uint256,uint64)" \
  "$AGENT_ID" "$AGENT_ADDRESS" "$SELECTOR" "$CAP_WEI" "$EXPIRY" \
  --rpc-url "$BASE_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"

# Narrow / rotate / change scope (epoch +1).
cast send "$POLICY_HUB_ADDRESS" \
  "updatePolicy(bytes32,address,bytes4,uint256,uint64)" \
  "$AGENT_ID" "$AGENT_ADDRESS" "$SELECTOR" "$CAP_WEI" "$EXPIRY" \
  --rpc-url "$BASE_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"

cast send "$POLICY_HUB_ADDRESS" "rotateAgentKey(bytes32,address)" "$AGENT_ID" "$AGENT_ADDRESS" \
  --rpc-url "$BASE_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"

# Revoke (epoch +1, active=false).
cast send "$POLICY_HUB_ADDRESS" "revokePolicy(bytes32)" "$AGENT_ID" \
  --rpc-url "$BASE_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"
```

After each source transaction, wait for the Lasna `react()` transaction and the Unichain callback
receipt. Verify the destination epoch before describing the policy as active or revoked there:

```bash
cast call "$POLICY_MIRROR_ADDRESS" "latestEpoch(bytes32)(uint64)" "$AGENT_ID" \
  --rpc-url "$UNICHAIN_RPC_URL"
cast call "$POLICY_MIRROR_ADDRESS" "getPolicy(bytes32)" "$AGENT_ID" \
  --rpc-url "$UNICHAIN_RPC_URL"
cast call "$GUARDED_VAULT_ADDRESS" "positions()(uint256,uint256)" \
  --rpc-url "$UNICHAIN_RPC_URL"
```

## 5. Agent action and denial proof

```bash
# Allowed action before revoke (signed by the ephemeral agent key).
cast send "$GUARDED_VAULT_ADDRESS" "rebalance(bytes32,uint256)" "$AGENT_ID" "$AMOUNT_WEI" \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$AGENT_SESSION_PRIVATE_KEY"

# Same action after the revoke callback: this is expected to revert.
cast send "$GUARDED_VAULT_ADDRESS" "rebalance(bytes32,uint256)" "$AGENT_ID" "$AMOUNT_WEI" \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$AGENT_SESSION_PRIVATE_KEY"
```

If a real reverted transaction is not submitted, use a labelled simulation instead:

```bash
cast call "$GUARDED_VAULT_ADDRESS" "rebalance(bytes32,uint256)" "$AGENT_ID" "$AMOUNT_WEI" \
  --rpc-url "$UNICHAIN_RPC_URL" --from "$AGENT_ADDRESS"
```

Record whether the denial evidence is a `revert` transaction or an `eth_call` simulation — never
present a simulation as a live transaction.

## 6. Emergency revoke and callback recovery

Destination-side break-glass (local admin only; does not emit a source event):

```bash
cast send "$POLICY_MIRROR_ADDRESS" "emergencyRevoke(bytes32)" "$AGENT_ID" \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"
```

Diagnosis sequence:

```bash
# 1. Source epoch and most recent log.
cast call "$POLICY_HUB_ADDRESS" "epochOf(bytes32)(uint64)" "$AGENT_ID" --rpc-url "$BASE_RPC_URL"
cast logs --address "$POLICY_HUB_ADDRESS" \
  'PolicyUpdated(bytes32,address,uint64,uint256,address,bytes4,uint256,uint64,bool,bytes32)' \
  --rpc-url "$BASE_RPC_URL"

# 2. Reactive request recorded? (policyAccepted includes the origin tx hash and payload.)
cast logs --address "$REACTIVE_CONTRACT_ADDRESS" \
  'PolicyAccepted(bytes32,uint64,bool,bytes32,uint256,bytes)' --rpc-url "$LASNA_RPC_URL"
cast call "$REACTIVE_CONTRACT_ADDRESS" "latestRequestedEpoch(bytes32)(uint64)" "$AGENT_ID" \
  --rpc-url "$LASNA_RPC_URL"

# 3. Mirror state and debt.
cast call "$POLICY_MIRROR_ADDRESS" "latestEpoch(bytes32)(uint64)" "$AGENT_ID" \
  --rpc-url "$UNICHAIN_RPC_URL"
cast call 0x775c9B990ADe401060B78D0e98684eEf8d2466C1 "debt(address)(uint256)" \
  "$POLICY_MIRROR_ADDRESS" --rpc-url "$UNICHAIN_RPC_URL"
cast call 0x8888888888888888888888888888888888888888 "debt(address)(uint256)" \
  "$REACTIVE_CONTRACT_ADDRESS" --rpc-url "$LASNA_RPC_URL"

# 4. Receipts. Never infer callback success from a request event alone.
cast receipt "$SOURCE_TX" --rpc-url "$BASE_RPC_URL"
cast receipt "$REACTIVE_TX" --rpc-url "$LASNA_RPC_URL"
cast receipt "$CALLBACK_TX" --rpc-url "$UNICHAIN_RPC_URL"
```

If a callback was requested but not delivered, the same epoch is **not** automatically
re-requested (`latestRequestedEpoch` already advanced). To resume through the authenticated path,
publish a new owner-authorised source mutation at a higher epoch (for example `updatePolicy` or a
revoke followed by an update); that produces a fresh log and a new callback. Use `emergencyRevoke`
only for immediate local containment, and note that its local epoch advance can cause lower source
epochs to be ignored.

## 7. Reserve top-up

```bash
# Check reserves.
cast balance "$POLICY_MIRROR_ADDRESS" --rpc-url "$UNICHAIN_RPC_URL"
cast balance "$REACTIVE_CONTRACT_ADDRESS" --rpc-url "$LASNA_RPC_URL"

# Top up destination reserve and clear outstanding debt.
cast send "$POLICY_MIRROR_ADDRESS" --value 1000000000000000 \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"
cast send "$POLICY_MIRROR_ADDRESS" "coverDebt()" \
  --rpc-url "$UNICHAIN_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY"

# Fund the reactive contract for Lasna execution ( payable receive() on AbstractPayer).
cast send "$REACTIVE_CONTRACT_ADDRESS" --value 1000000000000000 \
  --rpc-url "$LASNA_RPC_URL" --private-key "$REACTIVE_DEPLOYER_PRIVATE_KEY"
```

`coverDebt()` reads the proxy's `debt(address)` and pays it from the mirror's own balance; a
contract with insufficient balance reverts `InsufficientFunds`. Fund before calling. A failed
callback is still charged. `ScopeCastReactive` has no public `coverDebt` wrapper in the current
source, so fund its lREACT balance proactively.

## 8. Evidence capture checklist

- Source grant / revoke receipt hash and block timestamp.
- Lasna `react()` transaction hash; `PolicyAccepted` log with epoch and payload.
- Unichain callback receipt hash; `PolicyMirrored` or `StaleCallbackIgnored` event.
- Successful pre-revoke action hash and post-revoke denial (revert or labelled `eth_call`).
- Measured propagation time from source receipt timestamp to destination receipt timestamp, with the
  measurement method stated.
- Final `latestEpoch` / `getPolicy` reads and remaining destination reserve balance.

Update `apps/web/public/evidence/flow.json` only after these are independently verified; otherwise
the console remains `verified: false` and shows `UNKNOWN` / `SIMULATION`.
