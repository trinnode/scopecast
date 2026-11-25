# Reactive Omni — exact current technical facts

Research date: **2026-11-25**. All facts below are quoted from official sources retrieved on that
date. See `research/SOURCES_REACTIVE.md` for the source URL → claim mapping. Where the live docs
site was unreachable/truncated, the official `documentation` repository source (commit
`0ac3064f8a56760e67aec75abf67f485f7859698`, 2026-11-10) was used as ground truth; where the code
itself is authoritative, the pinned official library (commit
`3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8`, tag `v0.1.0`) was used.

> **Ground truth priority used here:** pinned library source > docs-repo source markdown > live docs
> site HTML > blog posts > demo repos (which are legacy/RVM, see §13).

---

## 0. Canonical quick reference (Omni only; `// ...` marks your own logic)

```solidity
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.29;

import { ISystemContract } from "@reactive/src/interfaces/ISystemContract.sol";
import { IReactive } from "@reactive/src/interfaces/IReactive.sol";
import { AbstractReactive } from "@reactive/src/base/AbstractReactive.sol";

contract MyReactive is AbstractReactive {
    // ... payable constructor calls SYSTEM.subscribe(...) ...

    /// @inheritdoc IReactive
    function react(LogRecord memory log_) external onlySystem {
        // ...
    }
}
```

```solidity
import { IPayable } from "@reactive/src/interfaces/IPayable.sol";
import { AbstractCallback } from "@reactive/src/base/AbstractCallback.sol";

contract MyCallback is AbstractCallback {
    constructor(IPayable callbackProxy_, address callbackSender_)
        payable
        AbstractCallback(callbackProxy_, callbackSender_)
    {}

    function myCallback(address reactive_, uint256 value_)
        external
        onlyServiceProvider
        onlyCallbackSender(reactive_)
    {
        // ...
    }
}
```

Foundry remapping (from the Reactive team's own `system-smart-contracts/remappings.txt`):

```
@reactive/src/=lib/reactive-lib-omni/src/
```

For this repo the vendored directory is named `reactive-lib`, so use:

```
remappings = ["@reactive/src/=lib/reactive-lib/src/"]
```

---

## 1. Solidity / compiler requirement

**Exact requirement: `pragma solidity ^0.8.29;`** — every one of the 8 vendored library files uses
it, and both current docs examples use it.

From `docs/docs/reactive-contracts.mdx` (Getting the inheritance right, verbatim):

```solidity
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.29;

import { ISystemContract } from "@reactive/src/interfaces/ISystemContract.sol";
import { IReactive } from "@reactive/src/interfaces/IReactive.sol";
import { AbstractReactive } from "@reactive/src/base/AbstractReactive.sol";
```

From `docs/docs/callback-contracts.mdx`:

```solidity
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.29;

import { IPayable } from "@reactive/src/interfaces/IPayable.sol";
import { AbstractCallback } from "@reactive/src/base/AbstractCallback.sol";
```

The official blog post "Lasna Testnet Completes Migration to Omni Fork" (2026-10-07) states the
same in prose: *"Reactive contracts now deploy once, to a single environment, as standard
Solidity targeting version 0.8.29, and dual deployment is a thing of the past."*

**Do not** copy the legacy demos' `pragma solidity >=0.8.0;`.

---

## 2. `AbstractReactive` — import path and exact shape

Official repo URL: **https://github.com/Reactive-Network/reactive-lib-omni** (branch `master`,
tag `v0.1.0`, pinned commit `3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8`).

`src/base/AbstractReactive.sol` verbatim from the pinned commit:

```solidity
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.29;

import { ISystemContract } from "../interfaces/ISystemContract.sol";
import { IReactive } from "../interfaces/IReactive.sol";
import { AbstractPayer } from "./AbstractPayer.sol";

/**
 * @title Abstract base contract for reactive contracts.
 */
abstract contract AbstractReactive is AbstractPayer, IReactive {
    /// @notice Address of the system contract in the reactive network.
    ISystemContract internal constant SYSTEM = ISystemContract(payable(0x8888888888888888888888888888888888888888));

    /// @notice Predefined wildcard topic value for event subscriptions.
    uint256 internal constant REACTIVE_IGNORE = 0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad;

    constructor() AbstractPayer(SYSTEM) {
    }

    /// @notice A modifier for guarding methods that should only be called by the system contract (e.g., `react()`).
    modifier onlySystem() {
        _onlyServiceProvider();
        _;
    }
}
```

Docs explanation (verbatim): *"It supplies `SYSTEM`, `REACTIVE_IGNORE`, and `onlySystem`, and
brings AbstractPayer with it."* and *"The modifier checks `msg.sender` against the service
provider, which for a reactive contract is `SYSTEM` at
`0x8888888888888888888888888888888888888888`, and reverts with `NotAuthorized` for anyone
else."*

`onlySystem` delegates to `AbstractPayer._onlyServiceProvider()`:

```solidity
/// @notice The implementation of the `onlyServiceProvider` modifier.
function _onlyServiceProvider() internal view {
    if (msg.sender != address(_SERVICE_PROVIDER)) {
        revert NotAuthorized(msg.sender, address(_SERVICE_PROVIDER));
    }
}
```

Inheritance note from docs: `IReactive` is imported for the `/// @inheritdoc IReactive` tag,
*not* needed for `LogRecord` (inheritance already provides it); `ISystemContract` is needed to
name the callback configuration struct and should be imported from the start.

---

## 3. `LogRecord` struct, topics and `opCode`

Verbatim from `src/interfaces/IReactive.sol` (identical to the docs snippet in
`reactive-contracts.mdx#reacting-to-events`):

```solidity
/// @notice A standard representation of log records from EVM-style networks.
struct LogRecord {
    uint256 chainId;
    address contractAddress;
    uint256 topic0;
    uint256 topic1;
    uint256 topic2;
    uint256 topic3;
    bytes data;
    uint256 blockNumber;
    uint256 opCode;
    uint256 blockHash;
    uint256 txHash;
    uint256 logIndex;
}
```

Docs, verbatim: *"`data` holds the ABI-encoded non-indexed parameters, and nothing else. `opCode`
is how many topics the original log had, so a `LOG3` arrives with `opCode` of `3`. And `blockHash`
and `txHash` are `uint256` rather than `bytes32`, so cast them if you're comparing against values
from elsewhere."*

* *"There are always four topic fields, and positions the original log didn't use are zero. Since
  `data`'s layout depends on which parameters were indexed, check `opCode` before decoding."*
* *"A zero in a topic position doesn't prove the log had fewer topics, since a topic can
  legitimately be zero. An ERC-20 mint emits `Transfer` with `from` as `address(0)`. `opCode` is
  the reliable count."*
* *"Logs that don't match should fall through and cost nothing extra. Reverting as a filter is a
  mistake: the system contract catches it, emits `ReactiveContractReverted`, and still bills you
  for the gas burned."*

Example from docs (verbatim):

```solidity
/// @inheritdoc IReactive
function react(LogRecord memory log_) external onlySystem {
    if (log_.topic0 == _topic0 && log_.opCode == 3) {
        uint256 amount = abi.decode(log_.data, ( uint256 ));

        // Handle the event.
    } else if (log_.topic0 == CRON100_TOPIC_0) {
        // Run scheduled work.
    }
}
```

---

## 4. `react(...)` — exact signature (important subtlety)

There are three authoritative forms, all compatible:

1. **Interface (pinned library, `IReactive.sol`), verbatim:**

   ```solidity
   /// @notice Entry point for handling new event notifications.
   /// @param log_ Data structure containing the information about the intercepted log record.
   /// @dev Will be called by the network's system contract, make sure to authenticate calls.
   function react(LogRecord calldata log_) external;
   ```

2. **Current docs canonical implementation form (`reactive-contracts.mdx`), verbatim:**

   ```solidity
   function react(LogRecord memory log_) external onlySystem {
   ```

   The migration guide (`docs/docs/index.md`) shows the same diff:

   ```solidity
   // diff-remove
   function react(LogRecord calldata log) external vmOnly {
   // diff-add
   function react(LogRecord memory log_) external onlySystem {
   ```

3. **Live official Omni contract** — `Reactive-Network/testnet-faucet`,
   `src/faucet/ReactiveFaucet.sol` (commit `6b69f5be8a330d544f37055c0a1324d2ca4fd904`),
   verbatim:

   ```solidity
   pragma solidity ^0.8.29;

   import { AbstractReactive } from "../../lib/reactive-lib-omni/src/base/AbstractReactive.sol";

   contract ReactiveFaucet is AbstractReactive {
       function react(LogRecord calldata log) external onlySystem {
           if (paused) return;

           address payable receiver = payable(address(uint160(log.topic1)));
           uint256 adjustedAmount = (log.topic2 * exchangeRate) / EXCHANGE_RATE_FACTOR;
           // ...
       }
   }
   ```

**Conclusion / guidance:** implement `function react(LogRecord memory log_) external onlySystem`
as the docs prescribe; `calldata` is equally valid for an external override (the official faucet
uses it). The mandatory part is **`external onlySystem`** — without `onlySystem` anyone can pass
a fabricated log. `IReactive` declares the parameter as `calldata`.

---

## 5. `SYSTEM.subscribe(...)` — exact signature and semantics

Verbatim from pinned `src/interfaces/ISubscriptionService.sol`:

```solidity
interface ISubscriptionService {
    /// @notice Subscribes the calling contract to receive events matching the criteria specified.
    /// @param chainId_ EIP155 source chain ID for the event (as a `uint256`), or `0` for all chains.
    /// @param contract_ Contract address to monitor, or `0` for all contracts.
    /// @param topic0_ Topic 0 to monitor, or `REACTIVE_IGNORE` for all topics.
    /// @param topic1_ Topic 1 to monitor, or `REACTIVE_IGNORE` for all topics.
    /// @param topic2_ Topic 2 to monitor, or `REACTIVE_IGNORE` for all topics.
    /// @param topic3_ Topic 3 to monitor, or `REACTIVE_IGNORE` for all topics.
    function subscribe(
        uint256 chainId_,
        address contract_,
        uint256 topic0_,
        uint256 topic1_,
        uint256 topic2_,
        uint256 topic3_
    ) external;

    /// @notice Removes active subscription of the calling contract, matching the criteria specified, if one exists.
    function unsubscribe(
        uint256 chainId_,
        address contract_,
        uint256 topic0_,
        uint256 topic1_,
        uint256 topic2_,
        uint256 topic3_
    ) external;
}
```

`SYSTEM` is typed `ISystemContract`, which extends `ISubscriptionService`, so the call form is
exactly the docs constructor (verbatim):

```solidity
constructor(uint256 originChainId_, address originContract_, uint256 topic0_) payable {
    _originChainId = originChainId_;
    _originContract = originContract_;
    _topic0 = topic0_;

    SYSTEM.subscribe(
        originChainId_,
        originContract_,
        topic0_,
        REACTIVE_IGNORE,
        REACTIVE_IGNORE,
        REACTIVE_IGNORE
    );
}
```

`REACTIVE_IGNORE = 0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad` (exact
value from `AbstractReactive.sol`). Docs constraint: *"At least one criterion has to be specific.
Subscribing to every event on every contract on every chain isn't allowed."* Subscriptions live
in the node, not contract storage; duplicates are allowed but pointless; unsubscribe must match
all six arguments exactly. Reactive MCP's `validate_subscription` tool specifically catches
`uint` vs `uint256` topic hashes, zero topics used as wildcards instead of `REACTIVE_IGNORE`, and
mainnet/testnet mixing (§11).

Runtime subscribe/unsubscribe helper pattern from docs (verbatim):

```solidity
function _subscribe() internal {
    SYSTEM.subscribe(
        _originChainId,
        _originContract,
        _topic0,
        REACTIVE_IGNORE,
        REACTIVE_IGNORE,
        REACTIVE_IGNORE
    );
}

function _unsubscribe() internal {
    SYSTEM.unsubscribe(
        _originChainId,
        _originContract,
        _topic0,
        REACTIVE_IGNORE,
        REACTIVE_IGNORE,
        REACTIVE_IGNORE
    );
}
```

---

## 6. Callback requests — exact API, struct, call form and payload rule

Verbatim from pinned `src/interfaces/ISystemContract.sol`:

```solidity
interface ISystemContract is IPayable, ISubscriptionService {
    /// @title List of supported callback configuration versions.
    enum CallbackVersion { V_1_0 }

    /// @title Callback configuration struct for legacy-style callbacks.
    struct CallbackConfiguration_V_1_0 { // forge-lint: disable-line(pascal-case-struct)
        uint256 chainId;
        address recipient;
        uint64 gasLimit;
        bytes payload;
    }

    /// @notice Requests the posting of a callback to some destination network.
    /// @param version_ Version of the callback configuration used.
    /// @param config_  ABI-encoded callback configration in a format corresponding to the version specified.
    function requestCallback(CallbackVersion version_, bytes memory config_) external;

    /// @notice Requests the posting of a legacy style callback to some destination network.
    /// @param config_  Callback configration in V_1_0 format.
    function requestCallbackV_1_0(CallbackConfiguration_V_1_0 memory config_) external; // forge-lint: disable-line(mixed-case-function)
}
```

Docs API summary (verbatim, `reactive-contracts.mdx#requesting-callbacks`):

```solidity
enum CallbackVersion { V_1_0 }

function requestCallback(CallbackVersion version_, bytes memory config_) external;
function requestCallbackV_1_0(CallbackConfiguration_V_1_0 memory config_) external;

struct CallbackConfiguration_V_1_0 {
    uint256 chainId;    // destination network
    address recipient;  // target contract on the destination chain
    uint64 gasLimit;    // execution gas limit
    bytes payload;      // ABI-encoded function call
}
```

Docs exact call form (verbatim):

```solidity
uint64 private constant CALLBACK_GAS_LIMIT = 1000000;

function _requestCallback(uint256 chainId_, address recipient_, uint256 value_) internal {
    bytes memory payload = abi.encodeWithSignature(
        "myCallback(address,uint256)",
        address(0),
        value_
    );

    SYSTEM.requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0({
        chainId: chainId_,
        recipient: recipient_,
        gasLimit: CALLBACK_GAS_LIMIT,
        payload: payload
    }));
}
```

Corroborated by the Reactive team's own Omni test (`system-smart-contracts`,
`test/omni/SystemContractTest.sol`, verbatim):

```solidity
ISystemContract.CallbackConfiguration_V_1_0 memory conf = ISystemContract.CallbackConfiguration_V_1_0({
    chainId: 1,
    recipient: ARB_ADDR,
    gasLimit: 1e6,
    payload: new bytes(32)
});

bytes memory encConf = abi.encode(conf);

_proxy.requestCallback(ISystemContract.CallbackVersion.V_1_0, encConf);
_proxy.requestCallbackV_1_0(conf);
```

**First-160-bit overwrite rule (verbatim docs info box):**

> Reactive Network replaces the first 160 bits of the payload with the address of the reactive
> contract that requested the callback, so the destination can authenticate the sender. Your
> payload has to declare an `address` there and pass `address(0)` as a placeholder, whatever you
> name it in Solidity. Forgetting it is the most common way to break a callback.

Other exact facts:
* Use `requestCallbackV_1_0()` for new code; the typed wrapper ABI-encodes the struct and calls
  `requestCallback(CallbackVersion.V_1_0, abi.encode(config))`. `V_1_0` is the only version today.
* `requestCallback()` reverts with `InvalidCallbackVersion` on an unknown version.
* Request causes `SYSTEM` to emit `CallbackRequest(uint256 indexed chainId, address indexed sender,
  address indexed recipient, CallbackVersion version, bytes configuration)`.
* Minimum callback gas limit: **100,000**; requests below it are ignored. Reactive tx gas cap:
  **900,000**.
* Callbacks are billed to the **recipient on the destination chain** in that chain's native
  currency, not in REACT; a recipient in debt receives nothing. A failed callback is still
  charged (`CallbackFailure`); a callback to an address with no code is rejected before charging.
* `IReactive.Callback` event still exists but docs say: *"Emitting a `Callback` event still works
  for contracts that already rely on it, but it's deprecated."* Do not use for new code.
* Deployment order (verbatim): 1. Deploy reactive contract. 2. Deploy callback contract, passing
  the callback proxy address and the reactive contract's address. 3. Set the recipient on the
  reactive contract through an owner-only setter. 4. Fund both.

---

## 7. `AbstractCallback` — import path, modifiers, exact shape

Verbatim from pinned `src/base/AbstractCallback.sol`:

```solidity
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.29;

import { IPayable } from "../interfaces/IPayable.sol";
import { AbstractPayer } from "./AbstractPayer.sol";

/**
 * @title Abstract base contract for contracts receiving the Reactive Network callbacks.
 */
abstract contract AbstractCallback is AbstractPayer {
    /// @notice Indicates that the callback sender is not authorized to perform the requested action.
    /// @param sender_ Address of the callback sender.
    /// @param expectedSender_ Expected callback sender.
    error CallbackNotAuthorized(address sender_, address expectedSender_);

    /// @notice Address of the reactive contract allowed to send callbacks.
    address public immutable _CALLBACK_SENDER;

    /// @param callbackProxy_ Address of the authorized callback proxy.
    /// @param callbackSender_ Address of the reactive contract allowed to send callbacks to this contract.
    constructor(IPayable callbackProxy_, address callbackSender_) AbstractPayer(callbackProxy_) {
        _CALLBACK_SENDER = callbackSender_;
    }

    /// @notice A modifier for guarding callback functions.
    /// @param callbackSender_ Address of the callback sender received from the callback proxy in the callback payload.
    modifier onlyCallbackSender(address callbackSender_) {
        _onlyCallbackSender(callbackSender_);
        _;
    }

    /// @notice The implementation of the `onlyCallbackSender` modifier.
    function _onlyCallbackSender(address callbackSender_) internal view {
        if (callbackSender_ != _CALLBACK_SENDER) {
            revert CallbackNotAuthorized(callbackSender_, _CALLBACK_SENDER);
        }
    }
}
```

`onlyServiceProvider` comes from `AbstractPayer.sol` (verbatim):

```solidity
modifier onlyServiceProvider() {
    _onlyServiceProvider();
    _;
}

function _onlyServiceProvider() internal view {
    if (msg.sender != address(_SERVICE_PROVIDER)) {
        revert NotAuthorized(msg.sender, address(_SERVICE_PROVIDER));
    }
}
```

Docs on why both are mandatory (verbatim): *"`onlyServiceProvider` asks whether the caller is the
callback proxy. Without it, anyone can call `myCallback()` directly and pass whatever address they
like as the first argument, defeating the second check entirely."* and *"`onlyCallbackSender(reactive_)`
asks whether the injected address is the reactive contract you authorized. Without it, any reactive
contract on the network can drive your callback through the legitimate proxy. Together they
establish that the call came through the network and originated from the contract you trust. Use
both, always."*

Additional facts: `_CALLBACK_SENDER` and `_SERVICE_PROVIDER` are `immutable` — a wrong
`callbackSender_` is unrecoverable (redeploy). A contract cannot be both reactive and callback:
`AbstractPayer` has one immutable `_SERVICE_PROVIDER`; inheriting both bases supplies conflicting
constructor arguments and won't compile. `_coverDebt()` is internal; expose a wrapper if needed.

---

## 8. Chain IDs, system contract, callback proxies — docs values

From `documentation` repo `src/components/origins-destinations-testnet-omni.js` (the source of
https://dev.reactive.network/origins-and-destinations), verbatim data rows:

| Chain | Chain ID | Callback proxy | Origin | Destination |
| --- | --- | --- | --- | --- |
| Base Sepolia | 84532 | `0x476F44b11F5C942c58f4c8E3d0300E5710743585` | ✅ | ✅ |
| Ethereum Sepolia | 11155111 | `0xAa14d9Cd0f788Ca23d11805986C1d8bd035D23b4` | ✅ | ✅ |
| Reactive Lasna | 5318007 | `0x8888888888888888888888888888888888888888` (system contract) | ✅ | ✅ |
| Unichain Sepolia | 1301 | `0x775c9B990ADe401060B78D0e98684eEf8d2466C1` | ✅ | ✅ |

From `docs/docs/reactive-mainnet.mdx`: Reactive Mainnet chain ID **1597**, RPC
`https://mainnet-rpc.rnk.dev/`, explorer `https://reactscan.net/`; Lasna chain ID **5318007**,
RPC `https://lasna-rpc.rnk.dev/`, explorer `https://lasna.reactscan.net/`, currency `lREACT`.
Mainnet and Lasna share system contract `0x8888888888888888888888888888888888888888`.
Docs warning: mainnets and testnets must not be mixed.

Faucet (docs `reactive-mainnet.mdx`): send SepETH to Base Sepolia
`0x2afaFD298b23b62760711756088F75B7409f5967` or Ethereum Sepolia
`0x9b9BB25f1A81078C544C829c5EB7822d747Cf434`; 1 ETH → 100 lREACT; max 5 ETH per tx.

---

## 9. RPC verification performed (2026-11-25)

Raw outputs are in `research/REACTIVE_VERIFICATION.txt`. Commands used:

```bash
# Base Sepolia
curl -s -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://base-sepolia-rpc.publicnode.com
# -> {"jsonrpc":"2.0","result":"0x14a34","id":1}   (84532)

# Unichain Sepolia
curl -s -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://sepolia.unichain.org
# -> {"jsonrpc":"2.0","result":"0x515","id":1}     (1301)

# Lasna (DNS workaround required)
curl -s --resolve lasna-rpc.rnk.dev:443:137.74.125.148 \
  -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://lasna-rpc.rnk.dev/
# -> {"jsonrpc":"2.0","id":1,"result":"0x512577"}  (5318007)
```

`eth_getCode` results (all `"latest"`):

| Target | RPC | Bytecode | Result |
| --- | --- | --- | --- |
| `0x476F44b11F5C942c58f4c8E3d0300E5710743585` (Base Sepolia callback proxy) | publicnode | **present, 436 bytes** | `0x60806040525f600b6038565b5f015f9054906101000a900473ffffffff…` |
| `0x775c9B990ADe401060B78D0e98684eEf8d2466C1` (Unichain Sepolia callback proxy) | sepolia.unichain.org | **present, 436 bytes** | identical prefix to Base proxy |
| `0x8888888888888888888888888888888888888888` (Lasna system contract) | lasna-rpc | **present, 478 bytes** | `0x60806040525f600b6038565b5f015f9054906101000a900473ffffffff…` |

All three bytecodes contain EIP-1967 implementation slot
`0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` — i.e. deployed as
proxies, consistent with `system-smart-contracts/src/omni/CallbackProxy.sol` /
`SystemContract.sol` behind `ERC1967Proxy`. Lasna `eth_blockNumber` returned `0x8ca7bb`
(9,198,011) at verification time. One Base chainId call returned an empty body on the first
attempt due to RPC flakiness; the retry succeeded (`0x14a34`). The raw file records the
successful response.

---

## 10. Reactive MCP (official, 2026-11-17)

Source: https://blog.reactive.network/reactive-mcp-live-diagnosis-for-reactive-contracts/ (plain
`curl` without `--resolve` failed; the working command was
`curl -s --resolve blog.reactive.network:443:137.74.125.148 <url>`).

Endpoint: **`https://mcp.rnk.dev/mcp`** — public, no authentication. `GET` returns **HTTP 405**
(verified 2026-11-25: `curl -s -o /dev/null -w '%{http_code}' https://mcp.rnk.dev/mcp`).

Official connection command, verbatim from the blog:

```bash
claude mcp add --transport http reactive-mcp https://mcp.rnk.dev/mcp
```

Blog, verbatim: *"Cursor and VS Code take the same URL in their MCP config files, and claude.ai
and ChatGPT accept it as a custom connector. The Reactive MCP page in our docs has snippets for
each. Queries default to Lasna testnet. To check the mainnet, just say so in your question, as in
'check `0x…` on the mainnet', and the agent passes it along."*

Capabilities: 14 tools — 9 diagnosis + 5 writing. Notable ones: `validate_subscription` (catches
`uint` vs `uint256` topic hashes, zero topics used as wildcards instead of `REACTIVE_IGNORE`,
mainnet/testnet mixing), `list_subscriptions`, `get_rc_health`, `trace_reactive_tx`,
`plan_rc`, `get_rc_template`, `check_rc_source`, `search_docs`, `get_doc`. Prompts:
`diagnose_rc`, `create_rc`, `review_rc_source`. Reports end with a verdict (e.g. `LOW_RESERVES`,
`DEST_IN_DEBT`) and confidence `proven` / `likely` / `cannot_prove`, plus on-chain evidence.
*Never asks for private keys and never sends transactions*; deploy suggestions use Foundry
`--account` keystore. This is `v0.1`; tool names and report formats may change.

**Blocker:** the docs page `https://dev.reactive.network/reactive-mcp` is linked in the docs nav
but returned HTTP 200 with an **empty body even with a 180 s timeout**, and no `reactive-mcp`
source file exists in the `documentation` repo `main` tree (commit `0ac3064f`). Connection
instructions above therefore come from the official blog, not that docs page.

---

## 11. Buildathon announcement (blog, 2026-11-04)

Source: https://blog.reactive.network/reactive-omni-buildathon-thirty-days-to-find-out-what-one-second-buys/
(working fetch required `--resolve blog.reactive.network:443:137.74.125.148`).

Key facts, quoted:
* *"Reactive Omni has been live on mainnet since October 28th. Starting tomorrow, November 5th,
  we're opening it up to builders: Reactive Omni Buildathon runs until December 5th, with $5,500
  in prizes, paid in REACT, across three tracks. Registration and submissions run through
  DoraHacks."*
* Tracks: **Every Second Counts** (DeFi where reaction time matters, built on Unichain Sepolia,
  Base Sepolia, or both, "with Reactive's Lasna testnet in the middle"; $2,000 + $250),
  **Set It and Forget It** (personal automations; $2,000 + $250), **Reactive Meets AI**
  ($1,000). AI must be part of the running system, not just the tool used to write the code.
* *"Reactive Omni runs on CometBFT consensus, with ~1s blocks and instant finality."* Old network
  blocks were ~7s. Unichain Sepolia produces 1s blocks; Base Sepolia produces **200ms blocks**
  after its Denim upgrade.
* *"On Base Sepolia, use timestamps rather than block counts for timers, cooldowns, or deadlines.
  Blocks now arrive every 200ms, so block-based timers run ten times faster than they used to."*
* "Every Second Counts" runs on Lasna; other tracks may use Reactive mainnet or Lasna. Repos
  must be public and open-source at submission. Everything should be built during the event
  (prior work may be a dependency). Submit: public repo URL, deployed contract addresses, a few
  transaction hashes showing full loop from origin event to callback, and a demo video under
  three minutes.
* Judging (1–5, equally weighted): Execution (*"we want to see the reactive transactions and the
  callbacks they trigger on-chain. Entries without them aren't scored further"*), Integration,
  Usefulness, Craft. Strongest entries show latency numbers measured across the full loop.

---

## 12. Vendored library

Location: `contracts/lib/reactive-lib/`.
Source: `https://github.com/Reactive-Network/reactive-lib-omni`, branch `master`, tag `v0.1.0`,
commit **`3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8`** (verified with `git ls-remote`: HEAD,
`refs/heads/master` and `refs/tags/v0.1.0` all point to that hash).

The same hash is independently pinned in the Reactive team's `system-smart-contracts/foundry.lock`:

```json
"lib/reactive-lib-omni": {
  "tag": { "name": "v0.1.0", "rev": "3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8" }
}
```

Vendored files (verbatim copy of upstream `src/`, verified with `diff -r`):

```
src/base/AbstractReactive.sol   src/interfaces/IPayable.sol
src/base/AbstractCallback.sol   src/interfaces/IPayer.sol
src/base/AbstractPayer.sol      src/interfaces/IReactive.sol
                                src/interfaces/ISubscriptionService.sol
                                src/interfaces/ISystemContract.sol
```

Provenance and hashes are recorded in `contracts/lib/reactive-lib/VENDORED.md`.

### Compile smoke test (2026-11-25)

A temporary Foundry project (`forge 1.5.1-stable`) with
`remappings = ["@reactive/src/=lib/reactive-lib/src/"]` and `solc = "0.8.29"`, containing a
contract with `react(LogRecord memory log_) external onlySystem` calling
`SYSTEM.subscribe(...)` and `SYSTEM.requestCallbackV_1_0(...)`, plus a callback contract using
`onlyServiceProvider` + `onlyCallbackSender(reactive_)`, compiled successfully:

```
Compiling 9 files with Solc 0.8.29
Solc 0.8.29 finished in 91.71ms
Compiler run successful with warnings:
Warning (2018): Function state mutability can be restricted to view  [test contract only]
```

This confirms the docs' `memory` signature is a valid override of the library interface's
`calldata` declaration, and that the vendored file set is self-contained (no extra dependencies).

---

## 13. Official demo repo inspection — and why it must not be copied

`https://github.com/Reactive-Network/reactive-smart-contract-demos` (main branch, last pushed
2026-10-07) is **entirely legacy/RVM**. The tarball fetch was truncated, but all `src/demos/*.sol`
files were retrieved individually via the GitHub API. Representative verbatim snippets:

`src/demos/basic/BasicDemoReactiveContract.sol`:

```solidity
pragma solidity >=0.8.0;

import '../../../lib/reactive-lib/src/interfaces/IReactive.sol';
import '../../../lib/reactive-lib/src/abstract-base/AbstractReactive.sol';

contract BasicDemoReactiveContract is IReactive, AbstractReactive {
    constructor(...) payable {
        if (!vm) {
            service.subscribe(originChainId, _contract, _topic_0,
                REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        bytes memory payload = abi.encodeWithSignature("callback(address)", address(0));
        emit Callback(destinationChainId, callback, GAS_LIMIT, payload);
    }
}
```

`src/demos/basic/BasicDemoL1Callback.sol`:

```solidity
constructor(address _callback_sender) AbstractCallback(_callback_sender) payable {}

function callback(address sender) external authorizedSenderOnly rvmIdOnly(sender) {
    emit CallbackReceived(tx.origin, msg.sender, sender);
}
```

`src/demos/aave-liquidation-protection/AaveProtectionDemoReactive.sol` additionally uses
`AbstractPausableReactive`, `log.topic_0`, `log._contract`, `getPausableSubscriptions()` and
`Subscription[]`. All of that is pre-Omni.

**Usable current Omni examples instead:**
1. `Reactive-Network/testnet-faucet`, `src/faucet/ReactiveFaucet.sol` (commit
   `6b69f5be8a330d544f37055c0a1324d2ca4fd904`) — real deployed Omni contract: `pragma ^0.8.29`,
   import `../../lib/reactive-lib-omni/src/base/AbstractReactive.sol`, constructor
   `SYSTEM.subscribe(chainId, l1, PAYMENT_REQUEST_TOPIC_0, REACTIVE_IGNORE, REACTIVE_IGNORE,
   REACTIVE_IGNORE)`, `react(LogRecord calldata log) external onlySystem`, pause/resume via
   `SYSTEM.unsubscribe`/`SYSTEM.subscribe`, `_coverDebt()` wrapper.
2. Docs `reactive-contracts.mdx` / `callback-contracts.mdx` examples in §0 and §6 — these are the
   canonical *reactive → callback* pair: constructor subscription, `react()` validation by
   `topic0`/`opCode`, payload with `address(0)` first argument, typed
   `SYSTEM.requestCallbackV_1_0(...)`, and callback guarded by
   `onlyServiceProvider` + `onlyCallbackSender(reactive_)`.
3. `Reactive-Network/system-smart-contracts`, `test/omni/SystemContractTest.sol` — exact config
   struct usage and equivalence of `requestCallback(V_1_0, abi.encode(conf))` and
   `requestCallbackV_1_0(conf)`.

---

## 14. DO NOT USE — legacy/RVM patterns

Every item below is from legacy Reactive (pre-Omni, pre-2026-10-07 Lasna / pre-2026-10-28
mainnet migration). Do not write these into new SCOPECAST contracts:

1. `pragma solidity >=0.8.0;` — use `^0.8.29`.
2. Legacy library repo `Reactive-Network/reactive-lib` (last push 2025-04-17) and its paths:
   `lib/reactive-lib/src/abstract-base/AbstractReactive.sol`,
   `.../abstract-base/AbstractCallback.sol`, `.../abstract-base/AbstractPausableReactive.sol`.
   Use `reactive-lib-omni` pinned above (`@reactive/src/...`).
3. Legacy system contract address `0x0000000000000000000000000000000000fffFfF` / variable
   `SERVICE_ADDR` / `service` object. Use `SYSTEM` = `0x8888…8888`.
4. `vm`, `vmOnly`, `if (!vm)`, `pretendVm()` and the whole dual-deployment / ReactVM state model.
   Omni has one network and one contract instance.
5. `emit Callback(chainId, recipient, gasLimit, payload)` — deprecated. Use
   `SYSTEM.requestCallbackV_1_0(...)`. (The `Callback` event still exists in `IReactive` only for
   backward compatibility; docs: *"Deprecated and should not be used for new development."*)
6. `authorizedSenderOnly`, `rvmIdOnly(sender)`, `rvmId`, `tx.origin`-based sender auth,
   single-argument `AbstractCallback(_callbackSender)` constructor. Use two-argument
   `AbstractCallback(IPayable callbackProxy_, address callbackSender_)` plus
   `onlyServiceProvider` and `onlyCallbackSender(reactive_)`.
7. Legacy `LogRecord` snake_case fields: `chain_id`, `_contract`, `topic_0`…`topic_3`,
   `block_number`, `op_code`, `block_hash`, `tx_hash`, `log_index`. Use camelCase fields from §3.
8. Custom RVM RPC methods, RVM traces, RC-specific precompiles/opcodes — all removed; standard
   EVM tooling (`cast`, normal explorers) only.
9. Zero topic values as wildcards — use `REACTIVE_IGNORE`; topic hashes must be `uint256`
   (`keccak256(...)`), not `uint`.
10. Mixing mainnet origins with testnet destinations (or vice versa).
11. Block-count-based timers/cooldowns/deadlines on Base Sepolia — use timestamps (200 ms blocks).
12. Stale content on the current `/debugging` docs page: its "Callback Structure" section still
    says "first slot must always be left for an RVM address" and shows `emit Callback(...)`.
    The current rule is the first 160 bits are overwritten with the *requesting reactive
    contract's* address and the callback goes through `SYSTEM.requestCallbackV_1_0(...)`.
13. Treating the `reactive-smart-contract-demos` repo as current — it is legacy (§13).
14. `gasLimit` below 100,000 for callbacks (ignored); block-based `cron()` timer assumptions on
    destination chains.

---

## 15. Blockers / caveats

* Live docs pages `reactive-contracts`, `callback-contracts`, `debugging`, `reactive-mcp` and
  `lasna-testnet` were repeatedly truncated or timed out even with the `--resolve` workaround;
  `lasna-testnet` now returns 404 (the current page is `/reactive-mainnet`). Official docs-repo
  markdown at commit `0ac3064f...` was used instead — this is the source that builds the site.
* `/reactive-mcp` docs page content remains unretrieved; blog is the source for MCP setup.
* The demo repo tarball download truncated; individual Solidity files were fetched via the
  GitHub contents API and are sufficient for the pattern audit.
* `react(LogRecord memory ...)` (docs) vs `react(LogRecord calldata ...)` (IReactive interface and
  the official faucet) is a real difference in examples but not an API break for external
  overrides. If compiling against the vendored interface, either form works; docs canonical is
  `memory`.
* No private keys, tokens, or secrets were used or recorded.
