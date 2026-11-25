// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { IPolicyMirror, ScopedPolicy } from "../src/interfaces/IScopecast.sol";

/// @notice Test-only mirror used to exercise the guarded module without the
///         Reactive callback path. NEVER deployed as part of the product.
contract MockPolicyMirror is IPolicyMirror {
    mapping(bytes32 => ScopedPolicy) private _policies;

    function setPolicy(bytes32 agentId, ScopedPolicy calldata policy) external {
        _policies[agentId] = policy;
    }

    function getPolicy(bytes32 agentId) external view returns (ScopedPolicy memory) {
        return _policies[agentId];
    }

    function latestEpoch(bytes32 agentId) external view returns (uint64) {
        return _policies[agentId].epoch;
    }
}
