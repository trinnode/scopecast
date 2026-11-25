// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { ScopedPolicy, PolicyHash } from "./interfaces/IScopecast.sol";

/// @title PolicyHub — authoritative agent-capability registry (Base Sepolia)
/// @notice The owner publishes, narrows, rotates and revokes versioned agent
///         policies. Every state change increments a monotonic epoch and emits
///         `PolicyUpdated`, which is the event the Reactive contract subscribes
///         to. The agent itself can never modify its own policy.
contract PolicyHub {
    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------
    error NotOwner();
    error ZeroOwner();
    error UnknownAgent();
    error AgentAlreadyExists();
    error ZeroAgent();
    error ZeroModule();
    error ZeroChain();
    error ZeroSelector();
    error ZeroCap();
    error ExpiredPolicy();
    error WrongDestinationChain();
    error WrongDestinationModule();

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------
    /// @notice Emitted after every policy mutation. Non-indexed field order is
    ///         intentional and MUST match the Reactive decoder exactly.
    event PolicyUpdated(
        bytes32 indexed agentId,
        address indexed agent,
        uint64 indexed epoch,
        uint256 destinationChainId,
        address destinationModule,
        bytes4 allowedSelector,
        uint256 maxValue,
        uint64 expiresAt,
        bool active,
        bytes32 policyHash
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------
    address public owner;

    /// @notice The only destination chain this hub can authorise. Restricting
    ///         it prevents a compromised owner from pointing a policy at an
    ///         unintended domain and keeps the Reactive filter tight.
    uint256 public immutable expectedDestinationChainId;

    /// @notice The only destination module this hub can authorise.
    address public immutable expectedDestinationModule;

    mapping(bytes32 agentId => ScopedPolicy policy) private _policies;
    mapping(bytes32 agentId => bool exists) private _exists;

    // ------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(uint256 destinationChainId_, address destinationModule_) {
        if (destinationChainId_ == 0) revert ZeroChain();
        if (destinationModule_ == address(0)) revert ZeroModule();
        expectedDestinationChainId = destinationChainId_;
        expectedDestinationModule = destinationModule_;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroOwner();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ------------------------------------------------------------------
    // Owner operations
    // ------------------------------------------------------------------
    /// @notice Install a brand-new active policy at epoch 1.
    function createPolicy(
        bytes32 agentId,
        address agent,
        bytes4 allowedSelector,
        uint256 maxValue,
        uint64 expiresAt
    ) external onlyOwner {
        if (_exists[agentId]) revert AgentAlreadyExists();
        _exists[agentId] = true;
        _write(agentId, agent, allowedSelector, maxValue, expiresAt, 1, true);
    }

    /// @notice Owner-authorised replacement. A policy can also be narrowed by
    ///         calling this with a smaller cap or earlier expiry. Any change
    ///         consumes a new epoch; no actor other than the owner can call it.
    function updatePolicy(
        bytes32 agentId,
        address agent,
        bytes4 allowedSelector,
        uint256 maxValue,
        uint64 expiresAt
    ) external onlyOwner {
        ScopedPolicy storage current = _requireExisting(agentId);
        // A fresh owner-authorised policy reactivates a revoked agent at a
        // strictly higher epoch. There is no unauthenticated path back to active.
        _write(agentId, agent, allowedSelector, maxValue, expiresAt, current.epoch + 1, true);
    }

    /// @notice Revoke a policy. The epoch advances and `active` becomes false.
    ///         A revoked policy can only be reactivated by a fresh owner update
    ///         at a strictly higher epoch.
    function revokePolicy(bytes32 agentId) external onlyOwner {
        ScopedPolicy storage current = _requireExisting(agentId);
        _emitState(
            agentId,
            current.agent,
            current.destinationChainId,
            current.destinationModule,
            current.allowedSelector,
            current.maxValue,
            current.expiresAt,
            current.epoch + 1,
            false,
            false
        );
    }

    /// @notice Rotate the agent key without changing the capability scope.
    ///         Revocation state is preserved (a revoked policy stays revoked).
    function rotateAgentKey(bytes32 agentId, address newAgent) external onlyOwner {
        ScopedPolicy storage current = _requireExisting(agentId);
        if (newAgent == address(0)) revert ZeroAgent();
        _emitState(
            agentId,
            newAgent,
            current.destinationChainId,
            current.destinationModule,
            current.allowedSelector,
            current.maxValue,
            current.expiresAt,
            current.epoch + 1,
            current.active,
            false
        );
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------
    function getPolicy(bytes32 agentId) external view returns (ScopedPolicy memory) {
        return _requireExisting(agentId);
    }

    function epochOf(bytes32 agentId) external view returns (uint64) {
        return _requireExisting(agentId).epoch;
    }

    function exists(bytes32 agentId) external view returns (bool) {
        return _exists[agentId];
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------
    function _requireExisting(bytes32 agentId) private view returns (ScopedPolicy storage policy) {
        if (!_exists[agentId]) revert UnknownAgent();
        policy = _policies[agentId];
    }

    function _write(
        bytes32 agentId,
        address agent,
        bytes4 allowedSelector,
        uint256 maxValue,
        uint64 expiresAt,
        uint64 epoch,
        bool active
    ) private {
        _emitState(
            agentId,
            agent,
            expectedDestinationChainId,
            expectedDestinationModule,
            allowedSelector,
            maxValue,
            expiresAt,
            epoch,
            active,
            true
        );
    }

    function _emitState(
        bytes32 agentId,
        address agent,
        uint256 destinationChainId,
        address destinationModule,
        bytes4 allowedSelector,
        uint256 maxValue,
        uint64 expiresAt,
        uint64 epoch,
        bool active,
        bool enforceFreshness
    ) private {
        if (agentId == bytes32(0)) revert UnknownAgent();
        if (agent == address(0)) revert ZeroAgent();
        if (destinationChainId != expectedDestinationChainId) revert WrongDestinationChain();
        if (destinationModule != expectedDestinationModule) revert WrongDestinationModule();
        if (allowedSelector == bytes4(0)) revert ZeroSelector();
        if (maxValue == 0) revert ZeroCap();
        if (enforceFreshness && expiresAt <= block.timestamp) revert ExpiredPolicy();

        bytes32 policyHash = PolicyHash.compute(
            agentId,
            agent,
            destinationChainId,
            destinationModule,
            allowedSelector,
            maxValue,
            expiresAt,
            epoch,
            active
        );

        _policies[agentId] = ScopedPolicy({
            agent: agent,
            destinationChainId: destinationChainId,
            destinationModule: destinationModule,
            allowedSelector: allowedSelector,
            maxValue: maxValue,
            expiresAt: expiresAt,
            epoch: epoch,
            active: active,
            policyHash: policyHash
        });

        emit PolicyUpdated(
            agentId,
            agent,
            epoch,
            destinationChainId,
            destinationModule,
            allowedSelector,
            maxValue,
            expiresAt,
            active,
            policyHash
        );
    }
}
