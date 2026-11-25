// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { Vm, MiniTest } from "./MiniTest.sol";
import { MockPolicyMirror } from "./MockPolicyMirror.sol";
import { MockAsset } from "../src/MockAsset.sol";
import { GuardedDeFiVault } from "../src/GuardedDeFiVault.sol";
import { ScopedPolicy, PolicyHash } from "../src/interfaces/IScopecast.sol";

contract GuardedDeFiVaultTest is MiniTest {
    uint256 constant DEST_CHAIN = 1301;
    bytes32 constant AGENT_ID = keccak256("Northstar Rebalance Agent");
    address constant AGENT = address(0xA11CE);
    address constant OWNER = address(0xC0FFEE);
    bytes4 constant SELECTOR = bytes4(keccak256("rebalance(bytes32,uint256)"));

    MockPolicyMirror mirror;
    MockAsset asset;
    GuardedDeFiVault vault;

    function setUp() public {
        vm.warp(1_800_000_000);
        vm.chainId(DEST_CHAIN);
        vm.label(OWNER, "owner");
        vm.label(AGENT, "agent");
        mirror = new MockPolicyMirror();
        asset = new MockAsset();
        vm.prank(OWNER);
        vault = new GuardedDeFiVault(address(mirror), address(asset));
        asset.mint(OWNER, 100 ether);
        vm.prank(OWNER);
        asset.approve(address(vault), 100 ether);
        vm.prank(OWNER);
        vault.seed(50 ether);
    }

    function _policy(address agent, bytes4 selector, uint256 cap, uint64 expiry, bool active)
        internal
        view
        returns (ScopedPolicy memory)
    {
        return ScopedPolicy({
            agent: agent,
            destinationChainId: DEST_CHAIN,
            destinationModule: address(vault),
            allowedSelector: selector,
            maxValue: cap,
            expiresAt: expiry,
            epoch: 1,
            active: active,
            policyHash: PolicyHash.compute(
                AGENT_ID, agent, DEST_CHAIN, address(vault), selector, cap, expiry, 1, active
            )
        });
    }

    function _install(ScopedPolicy memory policy) internal {
        mirror.setPolicy(AGENT_ID, policy);
    }

    // -- happy path -----------------------------------------------------

    function test_allowedAgentCanRebalanceBeforeExpiry() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true));
        vm.prank(AGENT);
        vault.rebalance(AGENT_ID, 4 ether);
        (uint256 idle, uint256 strategy) = vault.positions();
        assertEq(idle, 46 ether);
        assertEq(strategy, 4 ether);
    }

    function test_actionEmitsEventWithEpoch() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true));
        vm.recordLogs();
        vm.prank(AGENT);
        vault.rebalance(AGENT_ID, 1 ether);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        Vm.Log memory log = logs[logs.length - 1];
        assertEq(log.topics[0], GuardedDeFiVault.ActionExecuted.selector);
        assertEq(log.topics[1], AGENT_ID);
        assertEq(address(uint160(uint256(log.topics[2]))), AGENT);
    }

    // -- every negative path -------------------------------------------

    function test_wrongAgentRejected() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true));
        vm.prank(address(0xBAD));
        vm.expectRevert(GuardedDeFiVault.WrongAgent.selector);
        vault.rebalance(AGENT_ID, 1 ether);
    }

    function test_wrongSelectorRejected() public {
        _install(
            _policy(
                AGENT,
                bytes4(keccak256("other(uint256)")),
                10 ether,
                uint64(block.timestamp + 3600),
                true
            )
        );
        vm.prank(AGENT);
        vm.expectRevert(GuardedDeFiVault.WrongSelector.selector);
        vault.rebalance(AGENT_ID, 1 ether);
    }

    function test_wrongTargetRejected() public {
        ScopedPolicy memory p =
            _policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true);
        p.destinationModule = address(0xDEAD);
        _install(p);
        vm.prank(AGENT);
        vm.expectRevert(GuardedDeFiVault.WrongTarget.selector);
        vault.rebalance(AGENT_ID, 1 ether);
    }

    function test_wrongChainRejected() public {
        ScopedPolicy memory p =
            _policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true);
        p.destinationChainId = 84532;
        _install(p);
        vm.prank(AGENT);
        vm.expectRevert(GuardedDeFiVault.WrongChain.selector);
        vault.rebalance(AGENT_ID, 1 ether);
    }

    function test_capExceededRejected() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true));
        vm.prank(AGENT);
        vm.expectRevert(GuardedDeFiVault.ActionCapExceeded.selector);
        vault.rebalance(AGENT_ID, 10 ether + 1);
    }

    function test_zeroAmountRejected() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true));
        vm.prank(AGENT);
        vm.expectRevert(GuardedDeFiVault.ActionCapExceeded.selector);
        vault.rebalance(AGENT_ID, 0);
    }

    function test_expiredPolicyRejected() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp - 1), true));
        vm.prank(AGENT);
        vm.expectRevert(GuardedDeFiVault.PolicyExpired.selector);
        vault.rebalance(AGENT_ID, 1 ether);
    }

    function test_revokedPolicyRejected() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), false));
        vm.prank(AGENT);
        vm.expectRevert(GuardedDeFiVault.AgentPolicyInactive.selector);
        vault.rebalance(AGENT_ID, 1 ether);
    }

    function test_actionAfterDestinationRevokeRejected() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true));
        vm.prank(AGENT);
        vault.rebalance(AGENT_ID, 2 ether);

        // Mirror applies a newer, inactive epoch (this is what the reactive
        // callback does in the real flow).
        ScopedPolicy memory revoked =
            _policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), false);
        revoked.epoch = 2;
        revoked.policyHash = PolicyHash.compute(
            AGENT_ID,
            AGENT,
            DEST_CHAIN,
            address(vault),
            SELECTOR,
            10 ether,
            revoked.expiresAt,
            2,
            false
        );
        _install(revoked);

        vm.prank(AGENT);
        vm.expectRevert(GuardedDeFiVault.AgentPolicyInactive.selector);
        vault.rebalance(AGENT_ID, 2 ether);

        (, uint256 strategy) = vault.positions();
        assertEq(strategy, 2 ether); // the settled action is not reversed
    }

    // -- funding isolation ---------------------------------------------

    function test_ownerCannotUseAgentEntryPointForArbitraryRecipient() public {
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true));
        // The vault exposes no recipient-bearing agent function at all.
        assertEq(address(vault).code.length > 0, true);
        vm.prank(OWNER);
        vm.expectRevert(GuardedDeFiVault.WrongAgent.selector);
        vault.rebalance(AGENT_ID, 1 ether);
    }

    function testFuzz_anyAmountWithinCapMovesExactlyThatAmount(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 10 ether);
        _install(_policy(AGENT, SELECTOR, 10 ether, uint64(block.timestamp + 3600), true));
        vm.prank(AGENT);
        vault.rebalance(AGENT_ID, amount);
        (, uint256 strategy) = vault.positions();
        assertEq(strategy, amount);
    }
}
