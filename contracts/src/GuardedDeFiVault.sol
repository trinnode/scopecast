// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { IPolicyMirror, ITestERC20, ScopedPolicy } from "./interfaces/IScopecast.sol";

/// @title GuardedDeFiVault — real destination integration (Unichain Sepolia)
/// @notice A deliberately small, auditable module that moves a test asset
///         between two internal mock strategy positions. The only agent-facing
///         entry point checks the mirrored capability on every call. It cannot
///         move funds to an arbitrary recipient or call an arbitrary target.
contract GuardedDeFiVault {
    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------
    error NotOwner();
    error AgentPolicyInactive();
    error WrongAgent();
    error WrongChain();
    error WrongTarget();
    error WrongSelector();
    error ActionCapExceeded();
    error PolicyExpired();
    error InsufficientHoldings();
    error ZeroAmount();
    error ReentrantCall();

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------
    event ActionExecuted(
        bytes32 indexed agentId,
        address indexed agent,
        uint256 amount,
        uint64 epoch,
        uint256 holdings,
        uint256 deployed
    );

    event Seeded(uint256 amount, uint256 holdings);
    event Withdrawn(uint256 amount, uint256 holdings);

    // ------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------
    IPolicyMirror public immutable mirror;
    ITestERC20 public immutable asset;
    address public owner;

    /// @dev Mock strategy accounting: idle tokens vs tokens deployed into the
    ///      demo strategy bucket. No external protocol is called.
    uint256 public holdings;
    uint256 public deployed;

    bool private _entered;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_entered) revert ReentrantCall();
        _entered = true;
        _;
        _entered = false;
    }

    constructor(address mirror_, address asset_) {
        require(mirror_ != address(0), "zero mirror");
        require(asset_ != address(0), "zero asset");
        mirror = IPolicyMirror(mirror_);
        asset = ITestERC20(asset_);
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        owner = newOwner;
    }

    // ------------------------------------------------------------------
    // Owner funding paths (never callable by an agent)
    // ------------------------------------------------------------------
    function seed(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        require(asset.transferFrom(msg.sender, address(this), amount), "seed transfer failed");
        holdings += amount;
        emit Seeded(amount, holdings);
    }

    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        require(holdings >= amount, "insufficient holdings");
        holdings -= amount;
        require(asset.transfer(msg.sender, amount), "withdraw transfer failed");
        emit Withdrawn(amount, holdings);
    }

    // ------------------------------------------------------------------
    // The single guarded agent action
    // ------------------------------------------------------------------
    /// @notice Move `amount` test units from idle holdings into the mock
    ///         strategy bucket, only if the destination mirror currently
    ///         authorises this exact agent, module, selector, cap and expiry.
    function rebalance(bytes32 agentId, uint256 amount) external nonReentrant {
        ScopedPolicy memory policy = mirror.getPolicy(agentId);

        // Fail closed with distinct errors for diagnosable demo evidence.
        if (!policy.active) revert AgentPolicyInactive();
        if (msg.sender != policy.agent) revert WrongAgent();
        if (policy.destinationChainId != block.chainid) revert WrongChain();
        if (policy.destinationModule != address(this)) revert WrongTarget();
        if (policy.allowedSelector != this.rebalance.selector) revert WrongSelector();
        if (block.timestamp > policy.expiresAt) revert PolicyExpired();
        if (amount == 0 || amount > policy.maxValue) revert ActionCapExceeded();
        if (amount > holdings) revert InsufficientHoldings();

        // Effects only. There is no arbitrary external call or recipient.
        holdings -= amount;
        deployed += amount;

        emit ActionExecuted(agentId, msg.sender, amount, policy.epoch, holdings, deployed);
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------
    function positions() external view returns (uint256 idle, uint256 strategy) {
        return (holdings, deployed);
    }
}
