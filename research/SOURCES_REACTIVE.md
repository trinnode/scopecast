# Sources — Reactive Omni technical research

All sources accessed **2026-11-25** unless noted. No private keys or tokens were used in any
request. Where local DNS was flaky, the documented `--resolve` workarounds were used and are
recorded below.

## Official documentation (live site)

Live site: https://dev.reactive.network/. Several page bodies were truncated/timed out over the
flaky connection, so the corresponding markdown from the official `documentation` repository
(commit `0ac3064f8a56760e67aec75abf67f485f7859698`, pushed 2026-11-10) was used as the quotable
ground truth. That repository is what builds the site.

| Live URL | Retrieval status | Local source used | Supports |
| --- | --- | --- | --- |
| https://dev.reactive.network/origins-and-destinations | HTTP 200, body truncated (49 KB partial) | `Reactive-Network/documentation:docs/docs/origins-and-destinations.mdx` + `src/components/origins-destinations-testnet-omni.js` | Origin/destination roles, mainnet/testnet non-mixing, callback proxy address table (Base Sepolia `0x476F…`, Unichain Sepolia `0x775c…`, Ethereum Sepolia `0xAa14…`, Lasna system `0x8888…`), chain IDs |
| https://dev.reactive.network/reactive-contracts | HTTP 200, body truncated (4.7 KB partial) via resolve | `Reactive-Network/documentation:docs/docs/reactive-contracts.mdx` | `pragma ^0.8.29`, import paths, `AbstractReactive`, `SYSTEM.subscribe(...)`, `LogRecord`, `react(LogRecord memory log_) external onlySystem`, `requestCallbackV_1_0`, config struct, first-160-bit payload rule, deployment order, gas limits, debt/`_coverDebt()` |
| https://dev.reactive.network/callback-contracts | HTTP 200, body truncated (4.7 KB partial) via resolve | `Reactive-Network/documentation:docs/docs/callback-contracts.mdx` + `src/components/callback-inheritance-table.js` | `AbstractCallback` import path, two-arg constructor, `onlyServiceProvider` + `onlyCallbackSender`, `_CALLBACK_SENDER`, billing, deployment order, cannot inherit both bases |
| https://dev.reactive.network/economy | HTTP 200 (partial) via resolve | `Reactive-Network/documentation:docs/docs/economy.mdx` | Fee formula, reserves/debt, `depositTo`, `pay()`, `_coverDebt()`, 900,000 reactive gas cap, 100,000 callback gas minimum, `debt/reserves/_SERVICE_PROVIDER` reads, `getCallbacks` |
| https://dev.reactive.network/lasna-testnet | **HTTP 404** — replaced by `/reactive-mainnet` | `Reactive-Network/documentation:docs/docs/reactive-mainnet.mdx` | Lasna chain ID 5318007, RPC, faucet addresses, system contract address; mainnet chain ID 1597 |
| https://dev.reactive.network/reactive-mainnet | docs nav link; markdown source fetched from repo | same repo file as above | Mainnet/Lasna parameters |
| https://dev.reactive.network/debugging | HTTP 200 (partial) via resolve | `Reactive-Network/documentation:docs/docs/debugging.md` | Faucet, nonce/gas troubleshooting; **note: its "Callback Structure" section is stale legacy content** (RVM address / `emit Callback`) |
| https://dev.reactive.network/reactive-mcp | HTTP 200 but **empty body after 180 s**; page linked in nav | **no source file in docs repo main tree** — official blog used instead | MCP connection instructions taken from blog only |
| https://dev.reactive.network/ legacy pages | nav link observed | `docs/legacy/*` in repo | Confirmation that RVM-era docs are segregated under `/legacy` |

Live-site fetch command used (when it worked):

```bash
curl -sk --resolve dev.reactive.network:443:137.74.125.148 \
  https://dev.reactive.network/<page> -o /tmp/opencode/page_<page>.html
```

## Official docs repository (markdown source of the live site)

* Repo: https://github.com/Reactive-Network/documentation
* Branch: `main`; commit read: `0ac3064f8a56760e67aec75abf67f485f7859698` (2026-11-10)
* Access method: `env -u GH_TOKEN -u GITHUB_TOKEN gh api
  repos/Reactive-Network/documentation/contents/docs/docs/<file> --jq .content | base64 -d`
  (GitHub API worked reliably; direct `git clone` failed several times with TLS/HTTP2 resets)

Files read: `docs/docs/index.md`, `origins-and-destinations.mdx`, `reactive-contracts.mdx`,
`callback-contracts.mdx`, `economy.mdx`, `reactive-mainnet.mdx`, `debugging.md`;
components `src/components/origins-destinations-testnet-omni.js`,
`callback-inheritance-table.js`, `cron-table.js`, `subscription-table.js`, `reactive-inheritance-table.js`.

Supports: the Omni-vs-legacy code diff (§0/§4 of REACTIVE_TECHNICAL.md), all exact API signatures,
proxy addresses, and the stale-debugging-page caveat.

## Official reactive library (vendored ground truth)

* Repo: https://github.com/Reactive-Network/reactive-lib-omni
* Branch: `master`, tag `v0.1.0`, commit **`3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8`**
* `git ls-remote` confirmed HEAD, `refs/heads/master`, and `refs/tags/v0.1.0` all resolve to that
  commit (accessed 2026-11-25).
* Clone method: `git clone --depth 1 https://github.com/Reactive-Network/reactive-lib-omni.git`
  (this repo cloned successfully where others failed).
* Files read: all 8 Solidity files under `src/`: `base/AbstractReactive.sol`,
  `base/AbstractCallback.sol`, `base/AbstractPayer.sol`, `interfaces/IReactive.sol`,
  `interfaces/ISystemContract.sol`, `interfaces/ISubscriptionService.sol`,
  `interfaces/IPayable.sol`, `interfaces/IPayer.sol`.
* Independent pin confirmation: `Reactive-Network/system-smart-contracts:foundry.lock` pins
  `lib/reactive-lib-omni` to tag `v0.1.0` / rev `3ade0dcf…`.

Supports: exact `LogRecord` fields, `react(LogRecord calldata log_) external`, `SYSTEM`,
`REACTIVE_IGNORE`, `onlySystem`, `subscribe`/`unsubscribe` signatures, `CallbackVersion`,
`CallbackConfiguration_V_1_0`, `requestCallback`/`requestCallbackV_1_0`, `AbstractCallback` and
`onlyCallbackSender`, `onlyServiceProvider`/`NotAuthorized`.

Vendored at: `contracts/lib/reactive-lib/` (verbatim `src/` copy; provenance in `VENDORED.md`).

## Official blog posts

| URL | Access note | Supports |
| --- | --- | --- |
| https://blog.reactive.network/reactive-omni-buildathon-thirty-days-to-find-out-what-one-second-buys/ | `curl -s --resolve blog.reactive.network:443:137.74.125.148 <url>` (plain curl failed) | Buildathon dates (Nov 5 – Dec 5 2026), $5,500 REACT, three tracks, Base Sepolia 200ms blocks, Unichain Sepolia 1s blocks, timestamp-vs-block-count guidance, judging criteria, Lasna ~1s CometBFT finality |
| https://blog.reactive.network/reactive-mcp-live-diagnosis-for-reactive-contracts/ | same resolve workaround | MCP endpoint `https://mcp.rnk.dev/mcp`, public/no auth, `claude mcp add --transport http reactive-mcp https://mcp.rnk.dev/mcp`, 14 tools, `validate_subscription`, diagnoses/verdicts/confidence, defaults to Lasna, no keys/no transactions, v0.1 |
| https://blog.reactive.network/lasna-testnet-completes-migration-to-omni-fork/ (article title "Lasna Testnet Completes Migration to Omni Fork", 2026-10-07, linked from blog index on the buildathon page) | article title/date/snippet read from the buildathon page sidebar; full article not fetched separately | "RVM is gone", Solidity 0.8.29, single deployment, no dual deployment |

## Official code repos (examples / verification of call form)

| Repo / file | Commit | Supports |
| --- | --- | --- |
| https://github.com/Reactive-Network/system-smart-contracts `test/omni/SystemContractTest.sol` | main branch, read 2026-11-25 via GitHub API | Exact `CallbackConfiguration_V_1_0({chainId, recipient, gasLimit, payload})` construction; `requestCallback(V_1_0, abi.encode(conf))` ≡ `requestCallbackV_1_0(conf)`; `CallbackRequest` event |
| https://github.com/Reactive-Network/system-smart-contracts `remappings.txt`, `foundry.lock`, `src/omni/CallbackProxy.sol` | main branch | `@reactive/src/=lib/reactive-lib-omni/src/`; library pin; EIP-1967 proxy implementation |
| https://github.com/Reactive-Network/testnet-faucet `src/faucet/ReactiveFaucet.sol` | `6b69f5be8a330d544f37055c0a1324d2ca4fd904` (2026-10-09) | Live Omni reactive contract: `SYSTEM.subscribe`, `react(LogRecord calldata log) external onlySystem`, `SYSTEM.unsubscribe`, `_coverDebt()` |
| https://github.com/Reactive-Network/reactive-smart-contract-demos `src/demos/basic/*`, `src/demos/aave-liquidation-protection/*` | main branch, last pushed 2026-10-07 | **Legacy/RVM anti-patterns** used to build the DO NOT USE list (`service`, `vmOnly`, `emit Callback`, `AbstractCallback(_sender)`, `log.topic_0`, `authorizedSenderOnly`, `rvmIdOnly`) |
| https://github.com/Reactive-Network/reactive-test-lib `test/mocks/SampleReactiveContract.sol`, `SampleCallback.sol` | main branch | Additional legacy mock patterns (snake_case LogRecord, deprecated `Callback` event) — reference only, not for Omni |

GitHub API access method:

```bash
env -u GH_TOKEN -u GITHUB_TOKEN gh api 'repos/<owner>/<repo>/contents/<path>' --jq .content | base64 -d
```

## RPC endpoints (live verification, 2026-11-25)

| Endpoint | Command detail | Supports |
| --- | --- | --- |
| https://base-sepolia-rpc.publicnode.com | `eth_chainId` → `0x14a34` (84532); `eth_getCode` proxy `0x476F44b11F5C942c58f4c8E3d0300E5710743585` → 436-byte bytecode | Base Sepolia chain ID and deployed callback proxy |
| https://sepolia.unichain.org | `eth_chainId` → `0x515` (1301); `eth_getCode` proxy `0x775c9B990ADe401060B78D0e98684eEf8d2466C1` → 436-byte bytecode | Unichain Sepolia chain ID and deployed callback proxy |
| https://lasna-rpc.rnk.dev/ with `curl -s --resolve lasna-rpc.rnk.dev:443:137.74.125.148` | `eth_chainId` → `0x512577` (5318007); `eth_getCode` `0x8888888888888888888888888888888888888888` → 478-byte bytecode; `eth_blockNumber` → `0x8ca7bb` | Lasna chain ID, live system contract, liveness |
| https://mcp.rnk.dev/mcp | `curl -s -o /dev/null -w '%{http_code}'` → **405** on GET | Confirms HTTP MCP endpoint (POST-only), matching blog instructions |

Raw request/response bodies: `research/REACTIVE_VERIFICATION.txt`.

## Retrieval caveats

* `git clone` of `documentation` and `reactive-smart-contract-demos` failed with HTTP/2 resets;
  GitHub API contents/tarball endpoints and `gh api search/code` were used instead.
* `https://dev.reactive.network/reactive-mcp` and several other live docs pages could not be read
  in full despite the `--resolve` workaround. No claim in the research file depends solely on a
  truncated live page: docs-repo markdown or pinned library source was used for every API fact.
* `https://blog.reactive.network/...` requires the `--resolve` workaround from this environment;
  `mcp.rnk.dev` and the two publicnode/Unichain RPCs worked directly.
