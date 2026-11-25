// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { Vm, MiniTest } from "./MiniTest.sol";
import { IPayable } from "@reactive/src/interfaces/IPayable.sol";
import { AbstractPayer } from "@reactive/src/base/AbstractPayer.sol";
import { AbstractCallback } from "@reactive/src/base/AbstractCallback.sol";
import { PolicyMirror } from "../src/PolicyMirror.sol";
import { ScopedPolicy, PolicyHash } from "../src/interfaces/IScopecast.sol";

contract PolicyMirrorTest is MiniTest {
    uint256 constant DEST_CHAIN = 1301;
    address payable constant PROXY = payable(address(0xC0FFEE));
    address constant REACTIVE = address(0x4242);
    address constant OTHER_REACTIVE = address(0x4343);
    address constant ADMIN = address(0xAD);
    address constant MODULE = address(0xB0B);
    address constant AGENT = address(0xA11CE);
    bytes32 constant AGENT_ID = keccak256("Northstar Rebalance Agent");
    bytes4 constant SELECTOR = bytes4(keccak256("rebalance(bytes32,uint256)"));

    PolicyMirror mirror;

    function setUp() public {
        vm.chainId(DEST_CHAIN);
        mirror = new PolicyMirror(IPayable(PROXY), REACTIVE, ADMIN, MODULE);
    }

    struct Payload {
        bytes32 agentId;
        address agent;
        uint64 epoch;
        uint256 chain;
        address module;
        bytes4 selector;
        uint256 cap;
        uint64 expiry;
        bool active;
        bytes32 hash;
    }

    function _payload(uint64 epoch_, bool active_) internal view returns (Payload memory p) {
        p = Payload({
            agentId: AGENT_ID,
            agent: AGENT,
            epoch: epoch_,
            chain: DEST_CHAIN,
            module: MODULE,
            selector: SELECTOR,
            cap: 10 ether,
            expiry: uint64(block.timestamp + 3600),
            active: active_,
            hash: PolicyHash.compute(
                AGENT_ID,
                AGENT,
                DEST_CHAIN,
                MODULE,
                SELECTOR,
                10 ether,
                uint64(block.timestamp + 3600),
                epoch_,
                active_
            )
        });
    }

    function _apply(Payload memory p) internal {
        mirror.applyPolicy(
            REACTIVE,
            p.agentId,
            p.agent,
            p.epoch,
            p.chain,
            p.module,
            p.selector,
            p.cap,
            p.expiry,
            p.active,
            p.hash
        );
    }

    function _deliver(Payload memory p) internal {
        vm.prank(PROXY);
        _apply(p);
    }

    // -- authentication -------------------------------------------------

    function test_eoaCannotCallCallback() public {
        Payload memory p = _payload(1, true);
        vm.expectRevert(
            abi.encodeWithSelector(AbstractPayer.NotAuthorized.selector, address(this), PROXY)
        );
        _apply(p);
    }

    function test_proxyButWrongReactiveSenderIsRejected() public {
        Payload memory p = _payload(1, true);
        vm.prank(PROXY);
        vm.expectRevert(
            abi.encodeWithSelector(
                AbstractCallback.CallbackNotAuthorized.selector, OTHER_REACTIVE, REACTIVE
            )
        );
        mirror.applyPolicy(
            OTHER_REACTIVE,
            p.agentId,
            p.agent,
            p.epoch,
            p.chain,
            p.module,
            p.selector,
            p.cap,
            p.expiry,
            p.active,
            p.hash
        );
    }

    function test_correctCallbackAppliesPolicy() public {
        _deliver(_payload(1, true));
        assertEq(uint256(mirror.latestEpoch(AGENT_ID)), 1);
        assertEq(mirror.getPolicy(AGENT_ID).active, true);
    }

    // -- payload validation --------------------------------------------

    function test_wrongDestinationChainRejected() public {
        Payload memory p = _payload(1, true);
        p.chain = 84532;
        vm.prank(PROXY);
        vm.expectRevert(PolicyMirror.WrongDestinationChain.selector);
        _apply(p);
    }

    function test_unapprovedModuleRejected() public {
        Payload memory p = _payload(1, true);
        p.module = address(0xDEAD);
        vm.prank(PROXY);
        vm.expectRevert(PolicyMirror.ModuleNotApproved.selector);
        _apply(p);
    }

    function test_tamperedHashRejected() public {
        Payload memory p = _payload(1, true);
        p.hash = bytes32(keccak256("tampered"));
        vm.prank(PROXY);
        vm.expectRevert(PolicyMirror.BadPolicyHash.selector);
        _apply(p);
    }

    // -- epoch ordering -------------------------------------------------

    function test_staleCallbackIgnoredWithoutStateChange() public {
        _deliver(_payload(1, true));
        vm.recordLogs();
        _deliver(_payload(1, true));
        assertEq(uint256(mirror.latestEpoch(AGENT_ID)), 1);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 1);
        assertEq(logs[0].topics[0], PolicyMirror.StaleCallbackIgnored.selector);
    }

    function test_oldCallbackCannotReactivateRevokedPolicy() public {
        _deliver(_payload(1, true));
        _deliver(_payload(2, false));
        _deliver(_payload(1, true));
        ScopedPolicy memory p = mirror.getPolicy(AGENT_ID);
        assertEq(uint256(p.epoch), 2);
        assertEq(p.active, false);
    }

    function test_newerCallbackReactivatesAfterOwnerGrant() public {
        _deliver(_payload(1, true));
        _deliver(_payload(2, false));
        _deliver(_payload(3, true));
        assertTrue(mirror.getPolicy(AGENT_ID).active);
        assertEq(uint256(mirror.latestEpoch(AGENT_ID)), 3);
    }

    // -- emergency path -------------------------------------------------

    function test_nonAdminCannotEmergencyRevoke() public {
        vm.prank(address(0xBAD));
        vm.expectRevert(PolicyMirror.NotAdmin.selector);
        mirror.emergencyRevoke(AGENT_ID);
    }

    function test_emergencyRevokeAdvancesEpochAndDeactivates() public {
        _deliver(_payload(2, true));
        vm.prank(ADMIN);
        mirror.emergencyRevoke(AGENT_ID);
        ScopedPolicy memory p = mirror.getPolicy(AGENT_ID);
        assertEq(uint256(p.epoch), 3);
        assertEq(p.active, false);
        // A late callback at the previous epoch must not undo the emergency revoke.
        _deliver(_payload(2, true));
        assertEq(uint256(mirror.latestEpoch(AGENT_ID)), 3);
        assertEq(mirror.getPolicy(AGENT_ID).active, false);
    }

    function testFuzz_epochsAreMonotonic(uint64 first, uint64 second) public {
        vm.assume(first > 0 && second > first && second < type(uint64).max);
        Payload memory p1 = _payload(first, true);
        Payload memory p2 = _payload(second, false);
        _deliver(p1);
        _deliver(p2);
        _deliver(p1);
        assertEq(uint256(mirror.latestEpoch(AGENT_ID)), uint256(second));
        assertEq(mirror.getPolicy(AGENT_ID).active, false);
    }
}
