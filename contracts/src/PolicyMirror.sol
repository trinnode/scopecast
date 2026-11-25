// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { IPayable } from "@reactive/src/interfaces/IPayable.sol";
import { AbstractCallback } from "@reactive/src/base/AbstractCallback.sol";
import { IPolicyMirror, ScopedPolicy, PolicyHash } from "./interfaces/IScopecast.sol";

/// @title PolicyMirror — destination policy state (Unichain Sepolia)
/// @notice Accepts callbacks only through the official Reactive callback proxy
///         AND only from the one authorised reactive contract. Applies strictly
///         newer epochs, so an old delayed callback can never reactivate a
///         revoked capability. This contract is the only writer read by the
///         guarded module.
contract PolicyMirror is AbstractCallback, IPolicyMirror {
    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------
    error NotAdmin();
    error ZeroAdmin();
    error WrongDestinationChain();
    error ModuleNotApproved();
    error ZeroEpoch();
    error BadPolicyHash();
    error ZeroAgentId();
    error ZeroAgent();

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------
    event PolicyMirrored(
        bytes32 indexed agentId,
        uint64 indexed epoch,
        address indexed agent,
        bool active,
        bytes32 policyHash,
        address destinationModule
    );

    event StaleCallbackIgnored(bytes32 indexed agentId, uint64 receivedEpoch, uint64 storedEpoch);
    event ModuleApprovalChanged(address indexed module, bool approved);
    event EmergencyRevoke(bytes32 indexed agentId, uint64 epoch);

    // ------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------
    address public admin;
    mapping(address module => bool approved) public approvedModule;
    mapping(bytes32 agentId => ScopedPolicy policy) private _policies;
    mapping(bytes32 agentId => bool exists) private _exists;

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /// @param callbackProxy_ Official callback proxy for this destination chain.
    /// @param reactiveSender_ The only Reactive contract allowed to drive policy state.
    /// @param admin_ Destination emergency administrator (prefer a multisig).
    /// @param initialModule_ The guarded module this mirror serves by default.
    constructor(
        IPayable callbackProxy_,
        address reactiveSender_,
        address admin_,
        address initialModule_
    ) payable AbstractCallback(callbackProxy_, reactiveSender_) {
        if (admin_ == address(0)) revert ZeroAdmin();
        admin = admin_;
        if (initialModule_ != address(0)) {
            approvedModule[initialModule_] = true;
            emit ModuleApprovalChanged(initialModule_, true);
        }
    }

    function transferAdmin(address newAdmin_) external onlyAdmin {
        if (newAdmin_ == address(0)) revert ZeroAdmin();
        admin = newAdmin_;
    }

    function setModuleApproval(address module_, bool approved_) external onlyAdmin {
        approvedModule[module_] = approved_;
        emit ModuleApprovalChanged(module_, approved_);
    }

    /// @notice Callback entry point. Both modifiers are mandatory: the first
    ///         proves the caller is the network proxy; the second proves the
    ///         injected sender is the Reactive contract we authorised.
    function applyPolicy(
        address reactiveSender_,
        bytes32 agentId,
        address agent,
        uint64 epoch,
        uint256 destinationChainId,
        address destinationModule,
        bytes4 allowedSelector,
        uint256 maxValue,
        uint64 expiresAt,
        bool active,
        bytes32 policyHash
    ) external onlyServiceProvider onlyCallbackSender(reactiveSender_) {
        if (agentId == bytes32(0)) revert ZeroAgentId();
        if (agent == address(0)) revert ZeroAgent();
        if (epoch == 0) revert ZeroEpoch();
        if (destinationChainId != block.chainid) revert WrongDestinationChain();
        if (!approvedModule[destinationModule]) revert ModuleNotApproved();
        if (allowedSelector == bytes4(0) || maxValue == 0) revert BadPolicyHash();

        bytes32 expectedHash = PolicyHash.compute(
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
        if (expectedHash != policyHash) revert BadPolicyHash();

        uint64 storedEpoch = _exists[agentId] ? _policies[agentId].epoch : 0;
        if (epoch <= storedEpoch) {
            // Idempotent delivery: never revert, so a duplicate callback does
            // not waste the receiver's gas reserve.
            emit StaleCallbackIgnored(agentId, epoch, storedEpoch);
            return;
        }

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
        _exists[agentId] = true;

        emit PolicyMirrored(agentId, epoch, agent, active, policyHash, destinationModule);
    }

    /// @notice Destination-side emergency fallback. This is deliberately not a
    ///         substitute for the Reactive path — the demo still proves the
    ///         authenticated callback. It increments the epoch so a late source
    ///         callback at an older epoch cannot undo it.
    function emergencyRevoke(bytes32 agentId) external onlyAdmin {
        ScopedPolicy storage current = _policies[agentId];
        uint64 nextEpoch = current.epoch + 1;
        current.active = false;
        current.epoch = nextEpoch;
        current.policyHash = PolicyHash.compute(
            agentId,
            current.agent,
            current.destinationChainId,
            current.destinationModule,
            current.allowedSelector,
            current.maxValue,
            current.expiresAt,
            nextEpoch,
            false
        );
        _exists[agentId] = true;
        emit EmergencyRevoke(agentId, nextEpoch);
        emit PolicyMirrored(
            agentId, nextEpoch, current.agent, false, current.policyHash, current.destinationModule
        );
    }

    /// @inheritdoc IPolicyMirror
    function getPolicy(bytes32 agentId) external view returns (ScopedPolicy memory) {
        return _policies[agentId];
    }

    /// @inheritdoc IPolicyMirror
    function latestEpoch(bytes32 agentId) external view returns (uint64) {
        return _exists[agentId] ? _policies[agentId].epoch : 0;
    }

    function exists(bytes32 agentId) external view returns (bool) {
        return _exists[agentId];
    }

    /// @notice Public wrapper for the internal debt-cover helper, so an
    ///         operator can top up callback debt without redeploying.
    function coverDebt() external {
        _coverDebt();
    }
}
