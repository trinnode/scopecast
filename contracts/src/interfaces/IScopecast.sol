// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/// @notice The canonical capability shape shared by the source registry, the
///         Reactive decoder, the destination mirror and the guarded module.
///         Every field is covered by `PolicyHash.compute`.
struct ScopedPolicy {
    address agent;
    uint256 destinationChainId;
    address destinationModule;
    bytes4 allowedSelector;
    uint256 maxValue;
    uint64 expiresAt;
    uint64 epoch;
    bool active;
    bytes32 policyHash;
}

/// @notice Minimal view surface a guarded destination module needs.
interface IPolicyMirror {
    function getPolicy(bytes32 agentId) external view returns (ScopedPolicy memory);

    function latestEpoch(bytes32 agentId) external view returns (uint64);
}

/// @notice Minimal ERC-20 surface used by the test asset and demo vault.
interface ITestERC20 {
    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

/// @notice Canonical policy hash. All three chains MUST use this exact
///         definition; a mismatch means a tampered or mis-decoded payload.
library PolicyHash {
    function compute(
        bytes32 agentId,
        address agent,
        uint256 destinationChainId,
        address destinationModule,
        bytes4 allowedSelector,
        uint256 maxValue,
        uint64 expiresAt,
        uint64 epoch,
        bool active
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                agentId,
                agent,
                destinationChainId,
                destinationModule,
                allowedSelector,
                maxValue,
                expiresAt,
                epoch,
                active
            )
        );
    }
}
