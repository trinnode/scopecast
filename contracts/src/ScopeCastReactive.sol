// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { ISystemContract } from "@reactive/src/interfaces/ISystemContract.sol";
import { IReactive } from "@reactive/src/interfaces/IReactive.sol";
import { AbstractReactive } from "@reactive/src/base/AbstractReactive.sol";
import { PolicyHash } from "./interfaces/IScopecast.sol";

/// @title ScopeCastReactive — event consumer on Reactive Omni (Lasna)
/// @notice Subscribes to `PolicyUpdated` from one exact PolicyHub on one exact
///         origin chain. Validates every field before requesting an
///         authenticated callback to the destination PolicyMirror. Irrelevant
///         logs return silently rather than reverting: a reverted react call is
///         still billed by the Reactive network.
contract ScopeCastReactive is AbstractReactive {
    /// @notice Emitted when an event passes every check and a callback is requested.
    event PolicyAccepted(
        bytes32 indexed agentId,
        uint64 indexed epoch,
        bool active,
        bytes32 policyHash,
        uint256 originTxHash,
        bytes payload
    );

    error NotOwner();
    error ZeroHub();
    error ZeroTopic();
    error ZeroDestination();
    error ZeroGasLimit();
    error GasLimitTooLow();

    event Configured(address indexed hub, address indexed module, address indexed mirror);

    uint256 public immutable originChainId;
    uint256 public immutable policyTopic0;
    uint256 public immutable destinationChainId;
    uint64 public immutable callbackGasLimit;

    /// @dev These three addresses are owner-controlled bootstrap parameters:
    ///      the mirror has an immutable dependency on this contract's address,
    ///      and the hub has an immutable dependency on the vault address, so a
    ///      single-transaction cross-chain deployment is impossible. The owner
    ///      (a multisig in production) is the only writer.
    address public originHub;
    address public expectedDestinationModule;
    address public destinationMirror;
    address public owner;
    address public subscribedHub;

    /// @notice Highest epoch for which a callback has been requested per agent.
    mapping(bytes32 agentId => uint64 epoch) public latestRequestedEpoch;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        uint256 originChainId_,
        address originHub_,
        uint256 policyTopic0_,
        uint256 destinationChainId_,
        address destinationModule_,
        uint64 callbackGasLimit_
    ) payable {
        if (originHub_ == address(0)) revert ZeroHub();
        if (policyTopic0_ == 0) revert ZeroTopic();
        if (destinationChainId_ == 0) revert ZeroDestination();
        if (destinationModule_ == address(0)) revert ZeroDestination();
        if (callbackGasLimit_ == 0) revert ZeroGasLimit();
        // The system contract ignores callback requests below 100,000 gas.
        if (callbackGasLimit_ < 100_000) revert GasLimitTooLow();

        originChainId = originChainId_;
        originHub = originHub_;
        policyTopic0 = policyTopic0_;
        destinationChainId = destinationChainId_;
        expectedDestinationModule = destinationModule_;
        callbackGasLimit = callbackGasLimit_;
        owner = msg.sender;

        // Only topic0 is specific; indexed agentId/agent/epoch are wildcards.
        subscribedHub = originHub_;
        SYSTEM.subscribe(
            originChainId_,
            originHub_,
            policyTopic0_,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
    }

    /// @notice Owner bootstrap of cross-chain addresses. Re-subscribes to the
    ///         new hub if it changed, and unsubscribes from the old one.
    function configure(address hub_, address module_, address mirror_) external onlyOwner {
        if (hub_ == address(0) || module_ == address(0) || mirror_ == address(0)) {
            revert ZeroDestination();
        }
        if (subscribedHub != address(0) && subscribedHub != hub_) {
            SYSTEM.unsubscribe(
                originChainId,
                subscribedHub,
                policyTopic0,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
        originHub = hub_;
        expectedDestinationModule = module_;
        destinationMirror = mirror_;
        if (subscribedHub != hub_) {
            SYSTEM.subscribe(
                originChainId, hub_, policyTopic0, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE
            );
            subscribedHub = hub_;
        }
        emit Configured(hub_, module_, mirror_);
    }

    function setDestinationMirror(address mirror_) external onlyOwner {
        if (mirror_ == address(0)) revert ZeroDestination();
        destinationMirror = mirror_;
    }

    /// @notice Operator helper to clear reactive-side execution debt.
    function coverDebt() external {
        _coverDebt();
    }

    function transferOwnership(address newOwner_) external onlyOwner {
        if (newOwner_ == address(0)) revert NotOwner();
        owner = newOwner_;
    }

    /// @inheritdoc IReactive
    function react(IReactive.LogRecord memory log_) external onlySystem {
        if (destinationMirror == address(0)) return;
        if (log_.chainId != originChainId) return;
        if (log_.contractAddress != originHub) return;
        if (log_.topic0 != policyTopic0) return;

        // PolicyUpdated has three indexed parameters plus the event signature:
        // four topics total -> LOG4 -> opCode == 4. opCode is the EVM LOGn
        // value, i.e. the number of topics including topic0.
        if (log_.opCode != 4) return;

        bytes32 agentId = bytes32(log_.topic1);
        address agent = address(uint160(log_.topic2));
        uint64 epoch = uint64(log_.topic3);

        if (agentId == bytes32(0) || agent == address(0) || epoch == 0) return;

        (
            uint256 destinationChainId_,
            address destinationModule,
            bytes4 allowedSelector,
            uint256 maxValue,
            uint64 expiresAt,
            bool active,
            bytes32 policyHash
        ) = abi.decode(log_.data, (uint256, address, bytes4, uint256, uint64, bool, bytes32));

        if (destinationChainId_ != destinationChainId) return;
        if (destinationModule != expectedDestinationModule) return;
        if (allowedSelector == bytes4(0) || maxValue == 0) return;

        bytes32 expectedHash = PolicyHash.compute(
            agentId,
            agent,
            destinationChainId_,
            destinationModule,
            allowedSelector,
            maxValue,
            expiresAt,
            epoch,
            active
        );
        if (expectedHash != policyHash) return;

        // Idempotency / ordering: never request a callback for an epoch already
        // requested. This makes duplicate deliveries harmless and prevents an
        // out-of-order old event from being forwarded after a newer one.
        if (epoch <= latestRequestedEpoch[agentId]) return;
        latestRequestedEpoch[agentId] = epoch;

        // The first argument is overwritten by the network with this contract's
        // address, so the destination can authenticate the sender.
        bytes memory payload = abi.encodeWithSignature(
            "applyPolicy(address,bytes32,address,uint64,uint256,address,bytes4,uint256,uint64,bool,bytes32)",
            address(0),
            agentId,
            agent,
            epoch,
            destinationChainId_,
            destinationModule,
            allowedSelector,
            maxValue,
            expiresAt,
            active,
            policyHash
        );

        SYSTEM.requestCallbackV_1_0(
            ISystemContract.CallbackConfiguration_V_1_0({
                chainId: destinationChainId_,
                recipient: destinationMirror,
                gasLimit: callbackGasLimit,
                payload: payload
            })
        );

        emit PolicyAccepted(agentId, epoch, active, policyHash, log_.txHash, payload);
    }
}
