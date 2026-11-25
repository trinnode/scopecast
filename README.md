# SCOPECAST

**Revoke once. Enforce everywhere.**

Cross-chain agent-capability synchronisation for DeFi protocols, built for the Reactive Omni Buildathon (Every Second Counts).

> Status: active build. See `docs/` for architecture, security, deployment and submission details.
> All on-chain activity is **testnet only**. No mainnet funds are used.

## The idea

A delegated DeFi agent can hold scoped permissions on more than one chain. Updating each chain separately is slow and error-prone. SCOPECAST installs one authoritative policy registry on Base Sepolia; a Reactive Omni contract observes the versioned `PolicyUpdated` event and sends an authenticated callback to a `PolicyMirror` on Unichain Sepolia, where a `GuardedDeFiVault` enforces the mirrored capability.

The demo proves a concrete security property: the agent's bounded action **succeeds before** the revoke callback and is **rejected after** the newer epoch is applied. Revocation is asynchronous — SCOPECAST does not reverse settled transactions and does not claim atomic cross-chain revocation.

## Repository layout

- `contracts/` — Foundry project: source registry, reactive consumer, callback mirror, guarded vault, mocks, tests and deploy scripts.
- `apps/web/` — Next.js security console.
- `research/` — dated, sourced competitive and technical research.
- `docs/` — architecture, threat model, runbook, callback operations, deployments, submission and demo script.
- `design-system/` — persisted visual system rules.
- `public/brand/` — original SVG identity assets.

## Quickstart

```bash
cd contracts && forge build && forge test -vvv
cd ../apps/web && pnpm install && pnpm dev
```

See `docs/RUNBOOK.md` for the full deploy, grant, revoke and callback-recovery flow.

## License

MIT
