// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { Vm, MiniTest } from "./MiniTest.sol";
import { PolicyHub } from "../src/PolicyHub.sol";
import { ScopedPolicy, PolicyHash } from "../src/interfaces/IScopecast.sol";

contract PolicyHubTest is MiniTest {
    uint256 constant DEST_CHAIN = 1301;
    address constant MODULE = address(0xB0B);
    bytes32 constant AGENT_ID = keccak256("Northstar Rebalance Agent");
    address constant AGENT = address(0xA11CE);

    PolicyHub hub;

    function setUp() public {
        vm.warp(1_800_000_000);
        hub = new PolicyHub(DEST_CHAIN, MODULE);
    }

    function _create() internal {
        hub.createPolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            10 ether,
            uint64(block.timestamp + 3600)
        );
    }

    // -- access control -------------------------------------------------

    function test_onlyOwnerCanCreate() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert(PolicyHub.NotOwner.selector);
        hub.createPolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            10 ether,
            uint64(block.timestamp + 3600)
        );
    }

    function test_onlyOwnerCanUpdateRevokeRotate() public {
        _create();
        vm.startPrank(address(0xDEAD));
        vm.expectRevert(PolicyHub.NotOwner.selector);
        hub.updatePolicy(
            AGENT_ID, AGENT, bytes4(keccak256("x()")), 1 ether, uint64(block.timestamp + 10)
        );
        vm.expectRevert(PolicyHub.NotOwner.selector);
        hub.revokePolicy(AGENT_ID);
        vm.expectRevert(PolicyHub.NotOwner.selector);
        hub.rotateAgentKey(AGENT_ID, address(0x7777));
        vm.stopPrank();
    }

    function test_agentCannotModifyOwnPolicy() public {
        _create();
        vm.prank(AGENT);
        vm.expectRevert(PolicyHub.NotOwner.selector);
        hub.revokePolicy(AGENT_ID);
    }

    // -- epochs ---------------------------------------------------------

    function test_createStartsAtEpochOne() public {
        _create();
        assertEq(uint256(hub.epochOf(AGENT_ID)), 1);
        assertTrue(hub.exists(AGENT_ID));
    }

    function test_updateIncrementsEpochExactlyOnce() public {
        _create();
        hub.updatePolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            5 ether,
            uint64(block.timestamp + 7200)
        );
        assertEq(uint256(hub.epochOf(AGENT_ID)), 2);
        hub.updatePolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            4 ether,
            uint64(block.timestamp + 7200)
        );
        assertEq(uint256(hub.epochOf(AGENT_ID)), 3);
    }

    function test_revokeIncrementsEpochAndDeactivates() public {
        _create();
        hub.revokePolicy(AGENT_ID);
        ScopedPolicy memory p = hub.getPolicy(AGENT_ID);
        assertEq(uint256(p.epoch), 2);
        assertEq(p.active, false);
    }

    function test_rotatePreservesInactiveState() public {
        _create();
        hub.revokePolicy(AGENT_ID);
        hub.rotateAgentKey(AGENT_ID, address(0x7777));
        ScopedPolicy memory p = hub.getPolicy(AGENT_ID);
        assertEq(uint256(p.epoch), 3);
        assertEq(p.agent, address(0x7777));
        assertEq(p.active, false);
    }

    function test_revokedPolicyCanBeReactivatedOnlyAtHigherEpoch() public {
        _create();
        hub.revokePolicy(AGENT_ID);
        hub.updatePolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            10 ether,
            uint64(block.timestamp + 3600)
        );
        ScopedPolicy memory p = hub.getPolicy(AGENT_ID);
        assertEq(uint256(p.epoch), 3);
        assertEq(p.active, true);
    }

    // -- validation -----------------------------------------------------

    function test_cannotCreateDuplicate() public {
        _create();
        vm.expectRevert(PolicyHub.AgentAlreadyExists.selector);
        hub.createPolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            10 ether,
            uint64(block.timestamp + 3600)
        );
    }

    function test_rejectsExpiredPolicy() public {
        vm.expectRevert(PolicyHub.ExpiredPolicy.selector);
        hub.createPolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            10 ether,
            uint64(block.timestamp - 1)
        );
    }

    function test_rejectsZeroFields() public {
        vm.expectRevert(PolicyHub.ZeroAgent.selector);
        hub.createPolicy(
            AGENT_ID,
            address(0),
            bytes4(keccak256("rebalance(uint256)")),
            10 ether,
            uint64(block.timestamp + 100)
        );
        vm.expectRevert(PolicyHub.ZeroSelector.selector);
        hub.createPolicy(AGENT_ID, AGENT, bytes4(0), 10 ether, uint64(block.timestamp + 100));
        vm.expectRevert(PolicyHub.ZeroCap.selector);
        hub.createPolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            0,
            uint64(block.timestamp + 100)
        );
    }

    function test_revokeWorksAfterNaturalExpiry() public {
        _create();
        vm.warp(block.timestamp + 4000);
        hub.revokePolicy(AGENT_ID);
        assertEq(hub.getPolicy(AGENT_ID).active, false);
    }

    // -- event + hash integrity ----------------------------------------

    function test_eventCarriesAllFieldsAndCanonicalHash() public {
        bytes4 selector = bytes4(keccak256("rebalance(uint256)"));
        uint64 expiry = uint64(block.timestamp + 3600);
        bytes32 expectedHash = PolicyHash.compute(
            AGENT_ID, AGENT, DEST_CHAIN, MODULE, selector, 10 ether, expiry, 1, true
        );

        vm.recordLogs();
        hub.createPolicy(AGENT_ID, AGENT, selector, 10 ether, expiry);
        Vm.Log memory log = vm.getRecordedLogs()[0];

        assertEq(log.topics[0], PolicyHub.PolicyUpdated.selector);
        assertEq(log.topics[1], AGENT_ID);
        assertEq(address(uint160(uint256(log.topics[2]))), AGENT);
        assertEq(uint256(log.topics[3]), 1);

        // Seven non-indexed fields, in decoder order.
        (
            uint256 chain,
            address module,
            bytes4 sel,
            uint256 cap,
            uint64 exp,
            bool active,
            bytes32 hash
        ) = abi.decode(log.data, (uint256, address, bytes4, uint256, uint64, bool, bytes32));
        assertEq(chain, DEST_CHAIN);
        assertEq(module, MODULE);
        assertTrue(sel == selector);
        assertEq(cap, 10 ether);
        assertEq(exp, expiry);
        assertEq(active, true);
        assertEq(hash, expectedHash);
        assertEq(hub.getPolicy(AGENT_ID).policyHash, expectedHash);
    }

    // -- fuzz -----------------------------------------------------------

    function testFuzz_capAndExpiryAreBounded(uint256 cap, uint64 lifetime) public {
        vm.assume(cap > 1 && cap < type(uint128).max);
        vm.assume(lifetime > 60 && lifetime < 1_000_000);
        hub.createPolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            cap,
            uint64(block.timestamp + lifetime)
        );
        hub.updatePolicy(
            AGENT_ID,
            AGENT,
            bytes4(keccak256("rebalance(uint256)")),
            cap / 2,
            uint64(block.timestamp + lifetime)
        );
        ScopedPolicy memory p = hub.getPolicy(AGENT_ID);
        assertEq(uint256(p.epoch), 2);
        assertLe(p.maxValue, cap);
        assertTrue(p.active);
    }
}
