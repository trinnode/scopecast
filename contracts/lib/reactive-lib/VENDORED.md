# Vendored reactive library (Omni)

Official source: https://github.com/Reactive-Network/reactive-lib-omni
Branch: `master`
Tag: `v0.1.0`
Pinned commit: `3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8`
Access / vendoring date: 2026-11-25

This directory contains a verbatim copy of the `src/` tree of that commit (8 Solidity files).
No files were modified. Verify with:

```
diff -r <clone>/src contracts/lib/reactive-lib/src
```

The same commit is pinned by the Reactive team's own `system-smart-contracts`
`foundry.lock`:

```
"lib/reactive-lib-omni": {
  "tag": { "name": "v0.1.0", "rev": "3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8" }
}
```

## Files

- `src/base/AbstractReactive.sol` — `SYSTEM`, `REACTIVE_IGNORE`, `onlySystem`
- `src/base/AbstractCallback.sol` — `_CALLBACK_SENDER`, `onlyCallbackSender`
- `src/base/AbstractPayer.sol` — `_SERVICE_PROVIDER`, `onlyServiceProvider`, `pay()`, `_coverDebt()`
- `src/interfaces/IReactive.sol` — `LogRecord`, deprecated `Callback` event, abstract `react()`
- `src/interfaces/ISystemContract.sol` — `CallbackVersion`, `CallbackConfiguration_V_1_0`, `requestCallback`, `requestCallbackV_1_0`
- `src/interfaces/ISubscriptionService.sol` — `subscribe()`, `unsubscribe()`
- `src/interfaces/IPayable.sol` — `debt(address)`, payable `receive()`
- `src/interfaces/IPayer.sol` — `pay(uint256)`, payable `receive()`

All files declare `pragma solidity ^0.8.29;` and `SPDX-License-Identifier: UNLICENSED`
(the upstream license header is preserved verbatim).

## Recommended Foundry remapping

The official docs use `@reactive/src/...` import paths. Add to `foundry.toml`:

```
remappings = ["@reactive/src/=lib/reactive-lib/src/"]
```

The Reactive team's own `system-smart-contracts` repo uses
`@reactive/src/=lib/reactive-lib-omni/src/` when the submodule is named that way.

Do **not** substitute the legacy `Reactive-Network/reactive-lib` repository
(last pushed 2025-04-17): its paths (`src/abstract-base/...`) and API (`service`,
`vmOnly`, `emit Callback`) are RVM-era and will not work on Omni.
