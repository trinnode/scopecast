#!/usr/bin/env bash
# SCOPECAST testnet deployment. Reads secrets from .env (never printed).
# Run from the repository root: bash scripts/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "ERROR: create .env with DEPLOYER_PRIVATE_KEY and REACTIVE_DEPLOYER_PRIVATE_KEY (see .env.example)." >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; source .env; set +a

: "${DEPLOYER_PRIVATE_KEY:?DEPLOYER_PRIVATE_KEY missing}"
: "${REACTIVE_DEPLOYER_PRIVATE_KEY:?REACTIVE_DEPLOYER_PRIVATE_KEY missing}"

BASE_RPC="${NEXT_PUBLIC_BASE_RPC_URL:-https://base-sepolia-rpc.publicnode.com}"
UNI_RPC="${NEXT_PUBLIC_UNICHAIN_RPC_URL:-https://sepolia.unichain.org}"
LASNA_RPC="${NEXT_PUBLIC_LASNA_RPC_URL:-https://lasna-rpc.rnk.dev/}"

TOPIC0="0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9"
CALLBACK_PROXY_UNICHAIN="0x775c9B990ADe401060B78D0e98684eEf8d2466C1"
CALLBACK_GAS_LIMIT=300000
PLACEHOLDER="0x0000000000000000000000000000000000000001"

say() { printf '\n== %s ==\n' "$1"; }

deploy() {
  local rpc="$1" key="$2" target="$3"; shift 3
  local out
  if [ "$#" -gt 0 ]; then
    out="$(cd contracts && forge create "$target" --rpc-url "$rpc" --private-key "$key" --broadcast --constructor-args "$@")"
  else
    out="$(cd contracts && forge create "$target" --rpc-url "$rpc" --private-key "$key" --broadcast)"
  fi
  printf '%s\n' "$out" | awk '/^Deployed to:/ {print $3; exit}'
}

send() {
  local rpc="$1" key="$2" to="$3" sig="$4"; shift 4
  (cd contracts && cast send "$to" "$sig" "$@" --rpc-url "$rpc" --private-key "$key" --json) | jq -r '.transactionHash'
}

ADMIN_ADDR="$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY")"
REACTIVE_ADDR="$(cast wallet address --private-key "$REACTIVE_DEPLOYER_PRIVATE_KEY")"
echo "Deployer (Base/Unichain): $ADMIN_ADDR"
echo "Reactive deployer:        $REACTIVE_ADDR"

for pair in "Base|$BASE_RPC|84532" "Unichain|$UNI_RPC|1301" "Lasna|$LASNA_RPC|5318007"; do
  IFS='|' read -r name url expected <<<"$pair"
  actual="$(cast chain-id --rpc-url "$url")"
  if [ "$actual" != "$expected" ]; then echo "ERROR: $name chain id $actual != $expected" >&2; exit 1; fi
  echo "$name chain id verified: $actual"
done

say "1/6 Deploy ScopeCastReactive on Lasna (bootstrap placeholders)"
if [ -z "${REACTIVE_CONTRACT_ADDRESS:-}" ]; then
  REACTIVE_CONTRACT_ADDRESS="$(deploy "$LASNA_RPC" "$REACTIVE_DEPLOYER_PRIVATE_KEY" \
    'src/ScopeCastReactive.sol:ScopeCastReactive' 84532 "$PLACEHOLDER" "$TOPIC0" 1301 "$PLACEHOLDER" "$CALLBACK_GAS_LIMIT")"
fi
echo "ScopeCastReactive: $REACTIVE_CONTRACT_ADDRESS"

say "2/6 Deploy PolicyMirror on Unichain (binds reactive sender immutably)"
if [ -z "${POLICY_MIRROR_ADDRESS:-}" ]; then
  POLICY_MIRROR_ADDRESS="$(deploy "$UNI_RPC" "$DEPLOYER_PRIVATE_KEY" \
    'src/PolicyMirror.sol:PolicyMirror' "$CALLBACK_PROXY_UNICHAIN" "$REACTIVE_CONTRACT_ADDRESS" "$ADMIN_ADDR" "$PLACEHOLDER")"
fi
echo "PolicyMirror: $POLICY_MIRROR_ADDRESS"

say "3/6 Deploy MockAsset and GuardedDeFiVault on Unichain"
if [ -z "${TOKEN_ADDRESS:-}" ]; then
  TOKEN_ADDRESS="$(deploy "$UNI_RPC" "$DEPLOYER_PRIVATE_KEY" 'src/MockAsset.sol:MockAsset')"
fi
echo "MockAsset: $TOKEN_ADDRESS"
if [ -z "${GUARDED_VAULT_ADDRESS:-}" ]; then
  GUARDED_VAULT_ADDRESS="$(deploy "$UNI_RPC" "$DEPLOYER_PRIVATE_KEY" \
    'src/GuardedDeFiVault.sol:GuardedDeFiVault' "$POLICY_MIRROR_ADDRESS" "$TOKEN_ADDRESS")"
fi
echo "GuardedDeFiVault: $GUARDED_VAULT_ADDRESS"

say "4/6 Approve the vault module on the mirror"
send "$UNI_RPC" "$DEPLOYER_PRIVATE_KEY" "$POLICY_MIRROR_ADDRESS" \
  'setModuleApproval(address,bool)' "$GUARDED_VAULT_ADDRESS" true >/dev/null
echo "Module approved"

say "5/6 Deploy PolicyHub on Base Sepolia"
if [ -z "${POLICY_HUB_ADDRESS:-}" ]; then
  POLICY_HUB_ADDRESS="$(deploy "$BASE_RPC" "$DEPLOYER_PRIVATE_KEY" \
    'src/PolicyHub.sol:PolicyHub' 1301 "$GUARDED_VAULT_ADDRESS")"
fi
echo "PolicyHub: $POLICY_HUB_ADDRESS"

say "6/6 Configure the reactive contract (owner only) and verify subscription"
send "$LASNA_RPC" "$REACTIVE_DEPLOYER_PRIVATE_KEY" "$REACTIVE_CONTRACT_ADDRESS" \
  'configure(address,address,address)' "$POLICY_HUB_ADDRESS" "$GUARDED_VAULT_ADDRESS" "$POLICY_MIRROR_ADDRESS" >/dev/null

for item in "Base|$BASE_RPC|$POLICY_HUB_ADDRESS|expectedDestinationModule()" \
            "Unichain|$UNI_RPC|$POLICY_MIRROR_ADDRESS|reactiveSender()" \
            "Unichain|$UNI_RPC|$POLICY_MIRROR_ADDRESS|_CALLBACK_SENDER()" \
            "Lasna|$LASNA_RPC|$REACTIVE_CONTRACT_ADDRESS|originHub()" \
            "Lasna|$LASNA_RPC|$REACTIVE_CONTRACT_ADDRESS|destinationMirror()"; do
  IFS='|' read -r name rpc addr fn <<<"$item"
  result="$(cast call "$addr" "$fn" --rpc-url "$rpc")"
  echo "$name $fn -> $result"
done

cat > deployed-addresses.env <<EOF
NEXT_PUBLIC_POLICY_HUB_ADDRESS=$POLICY_HUB_ADDRESS
NEXT_PUBLIC_REACTIVE_CONTRACT_ADDRESS=$REACTIVE_CONTRACT_ADDRESS
NEXT_PUBLIC_POLICY_MIRROR_ADDRESS=$POLICY_MIRROR_ADDRESS
NEXT_PUBLIC_GUARDED_VAULT_ADDRESS=$GUARDED_VAULT_ADDRESS
NEXT_PUBLIC_TOKEN_ADDRESS=$TOKEN_ADDRESS
EOF
echo
echo "Addresses written to deployed-addresses.env (public — safe to commit values)."
echo "NEXT STEP: fund the mirror with Unichain ETH and the reactive deployer with lREACT, then run scripts/flow.sh"
