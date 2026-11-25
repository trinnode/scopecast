# SCOPECAST — 165-second demo script

> Target runtime: **2 minutes 45 seconds (165 s)**, under the three-minute limit. Timestamps are
> exact; keep a second take ready. All transaction hashes shown on screen must be independently
> verified on the correct chain (receipt present, status 1) before the video is recorded. Never read
> a hash from a chat message, a local test log or a placeholder. Never present a local simulation as
> a live callback.

## Live-receipt discipline

- Show the explorer page or `cast receipt` output for each stage; the hash on screen is the hash you
  verified. A `PolicyAccepted` event on Lasna means a callback was **requested**, not delivered.
- Say "confirmed" only for a stage with a successful receipt. Between source confirmation and
  destination confirmation say "propagation pending" and show `DESTINATION_SYNC_UNKNOWN`.
- The post-revoke denial is either a real reverted transaction, labelled `REVERT`, or an `eth_call`
  simulation, labelled `SIMULATION`. Never mix the two labels.
- The pre-revoke action and the post-revoke attempt must be the **same** function, agent key, agentId
  and amount.

---

## 0:00–0:15 — Problem (15 s)

> "A delegated DeFi agent can hold scoped permissions on more than one chain. If an operator revokes
> one session on the source chain, the other integrated chain can still enforce the old permission
> until it receives its own update. SCOPECAST makes that update one action, with a verifiable path
> from the source event to the destination guard. It is asynchronous — we will show the exact window."

Show: the route visual `BASE SEPOLIA → REACTIVE LASNA → UNICHAIN SEPOLIA`, testnet warning visible.

## 0:15–0:35 — The policy (20 s)

> "This is the whole policy: a stable agent ID, the authorised signer, the destination chain, the
> one approved module, one function selector, a per-action cap, an expiry, a monotonically
> increasing epoch, the active flag, and a hash binding all of those fields. The agent cannot change
> any of it. Only the owner on Base Sepolia can publish a new version."

Show: policy detail panel with the real `getPolicy` fields and epoch; highlight `active`, selector,
cap and expiry.

## 0:35–0:55 — The path (20 s)

> "PolicyHub lives on Base Sepolia. It emits a versioned PolicyUpdated event. A Reactive contract on
> Lasna is subscribed to that exact hub and topic; it validates the origin and the hash before it
> requests a callback. The callback proxy on Unichain Sepolia delivers it to PolicyMirror, which
> accepts only the proxy and the one authorised reactive contract, and only a strictly newer epoch.
> The guarded vault reads that mirror every time the agent acts."

Show: topology diagram, then the verified system contract and callback proxy addresses.

## 0:55–1:25 — Grant propagation (30 s)

> "Here is the owner's create transaction on Base Sepolia — source receipt confirmed, epoch one.
> Here is the Reactive transaction on Lasna: the PolicyAccepted log shows the epoch and the
> callback payload it requested. And here is the destination receipt on Unichain Sepolia:
> PolicyMirrored, epoch one, active. The destination is now active because the callback was
> confirmed, not because the source transaction succeeded. Until that receipt arrived, the console
> showed DESTINATION SYNC UNKNOWN."

Show: three receipts in order; read only verified hashes. Pause on the destination receipt.

## 1:25–1:40 — Allowed action (15 s)

> "Now the agent signs the permitted action: rebalance, bounded by the cap and the expiry. The vault
> checks the mirrored policy on this very call — active, correct agent, correct chain, correct
> target, correct selector, amount within cap, not expired. It succeeds, and the strategy position
> moves. This transaction is settled test state; it will not be reversed."

Show: successful `ActionExecuted` transaction and the before/after positions.

## 1:40–2:10 — Revoke propagation (30 s)

> "Now I revoke on the source. The hub advances to epoch two and records active false — source
> receipt confirmed. At this moment the destination is still at epoch one: propagation is pending,
> not atomic. Here is the Reactive transaction that processed the revoke event and requested the
> callback. And here is the destination receipt: the mirror applied epoch two, active false, through
> the authenticated callback path. A duplicate or older callback cannot undo this."

Show: source revoke receipt → Lasna react receipt → Unichain callback receipt; briefly show the
pending state before the destination receipt.

## 2:10–2:30 — Denial proof (20 s)

> "Same agent, same function, same amount. The vault reads the mirror again and rejects the call
> with AgentPolicyInactive. The earlier action remains settled — SCOPECAST blocks future actions; it
> does not reverse the past. This rejection is a real reverted transaction, so there is no ambiguity
> about where the enforcement happened."

Show: the reverted transaction and its custom error. If using `eth_call`, say "simulation" instead
of reverted transaction and show the labelled output.

## 2:30–2:45 — Honest close (15 s)

> "The property is simple: grant, act, revoke once, and the integrated guard enforces the newer
> epoch after the callback arrives. It is not instant, not atomic and not universal — only modules
> reading the mirror are protected, and the callback receiver pays gas in destination native token.
> Different from gas-refill freezes, budget scalars or local spender lists: this is a versioned
> capability policy, mirrored by Reactive, enforced on-chain. Repository and receipts are linked."

Show: repository URL, `DEPLOYMENTS.md` table, differentiator one-liner.

---

## Fallback plan if an explorer is slow

1. **Do not narrate an unconfirmed stage.** Pause and say "waiting for the destination receipt" —
   the propagation window is part of the honest story.
2. Switch from the explorer to CLI verification using pre-captured hashes and the correct RPC:
   ```bash
   cast receipt "$SOURCE_TX" --rpc-url "$BASE_RPC_URL"
   cast receipt "$REACTIVE_TX" --rpc-url "$LASNA_RPC_URL"
   cast receipt "$CALLBACK_TX" --rpc-url "$UNICHAIN_RPC_URL"
   cast logs --address "$POLICY_MIRROR_ADDRESS" \
     'PolicyMirrored(bytes32,uint64,address,bool,bytes32,address)' --rpc-url "$UNICHAIN_RPC_URL"
   ```
   Terminal output from a verified receipt is acceptable evidence; do not edit it.
3. If the callback itself is delayed, show the already-verified grant receipts and explain the
   pending state, then use a second take once the destination receipt exists. Do not substitute a
   local harness run: `IntegrationHarness.t.sol` uses `vm.etch`/`vm.prank` stubs and is labelled
   `SIMULATION`.
4. If a stage genuinely failed, follow `CALLBACK_OPERATIONS.md` §5 (reserve top-up, `coverDebt()`,
   then a new higher-epoch source mutation) and re-record. Never splice two different runs into one
   "live" sequence without saying so.
5. Keep a static, labelled fallback slide of the verified receipt table from `DEPLOYMENTS.md` for
   each stage; it must show real hashes, never `<PENDING_TX>`.
