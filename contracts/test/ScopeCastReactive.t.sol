// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { Vm, MiniTest } from "./MiniTest.sol";
import { IReactive } from "@reactive/src/interfaces/IReactive.sol";
import { ScopeCastReactive } from "../src/ScopeCastReactive.sol";
import { PolicyHash } from "../src/interfaces/IScopecast.sol";

contract ScopeCastReactiveTest is MiniTest {
    address constant SYSTEM = address(0x8888888888888888888888888888888888888888);
    uint256 constant ORIGIN_CHAIN = 84532;
    uint256 constant DEST_CHAIN = 1301;
    uint256 constant TOPIC0 = 0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9;
    address constant HUB = address(0x1234);
    address constant MODULE = address(0xB0B);
    address constant MIRROR = address(0x9999);
    address constant AGENT = address(0xA11CE);
    bytes32 constant AGENT_ID = keccak256("Northstar Rebalance Agent");
    bytes4 constant SELECTOR = bytes4(keccak256("rebalance(bytes32,uint256)"));

    ScopeCastReactive reactive;

    function setUp() public {
        // Local stub for the Reactive system contract: its real bytecode only
        // exists on Lasna. This is a harness, not proof of live integration.
        vm.etch(SYSTEM, hex"60006000f3");
        reactive = new ScopeCastReactive(ORIGIN_CHAIN, HUB, TOPIC0, DEST_CHAIN, MODULE, 300_000);
        reactive.setDestinationMirror(MIRROR);
    }

    function _log(
        uint256 chainId_,
        address emitter_,
        uint256 topic0_,
        uint256 opCode_,
        uint64 epoch_,
        bool active_,
        bytes32 hash_
    ) internal view returns (IReactive.LogRecord memory log_) {
        bytes memory data = abi.encode(
            DEST_CHAIN,
            MODULE,
            SELECTOR,
            uint256(10 ether),
            uint64(block.timestamp + 3600),
            active_,
            hash_
        );
        log_ = IReactive.LogRecord({
            chainId: chainId_,
            contractAddress: emitter_,
            topic0: topic0_,
            topic1: uint256(AGENT_ID),
            topic2: uint256(uint160(AGENT)),
            topic3: uint256(epoch_),
            data: data,
            blockNumber: 100,
            opCode: opCode_,
            blockHash: 0,
            txHash: 0,
            logIndex: 0
        });
    }

    function _hash(uint64 epoch_, bool active_) internal view returns (bytes32) {
        return PolicyHash.compute(
            AGENT_ID,
            AGENT,
            DEST_CHAIN,
            MODULE,
            SELECTOR,
            10 ether,
            uint64(block.timestamp + 3600),
            epoch_,
            active_
        );
    }

    function _deliver(IReactive.LogRecord memory log_) internal {
        vm.prank(SYSTEM);
        reactive.react(log_);
    }

    // -- access control -------------------------------------------------

    function test_onlySystemCanCallReact() public {
        vm.expectRevert();
        reactive.react(_log(ORIGIN_CHAIN, HUB, TOPIC0, 3, 1, true, _hash(1, true)));
    }

    function test_onlyOwnerCanSetMirror() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert(ScopeCastReactive.NotOwner.selector);
        reactive.setDestinationMirror(address(0x7777));
    }

    // -- filtering ------------------------------------------------------

    function test_acceptsMatchingEvent() public {
        vm.recordLogs();
        _deliver(_log(ORIGIN_CHAIN, HUB, TOPIC0, 3, 1, true, _hash(1, true)));
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 1);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 1);
        assertEq(logs[0].topics[0], ScopeCastReactive.PolicyAccepted.selector);
    }

    function test_ignoresWrongChain() public {
        _deliver(_log(84533, HUB, TOPIC0, 3, 1, true, _hash(1, true)));
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 0);
    }

    function test_ignoresWrongEmitter() public {
        _deliver(_log(ORIGIN_CHAIN, address(0xBAD), TOPIC0, 3, 1, true, _hash(1, true)));
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 0);
    }

    function test_ignoresWrongTopic() public {
        _deliver(
            _log(
                ORIGIN_CHAIN, HUB, uint256(keccak256("Other(uint256)")), 3, 1, true, _hash(1, true)
            )
        );
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 0);
    }

    function test_ignoresWrongTopicCount() public {
        // A LOG2 event: the indexed-epoch topic is absent, so decoding would
        // read the wrong data layout. The opCode guard must skip it.
        _deliver(_log(ORIGIN_CHAIN, HUB, TOPIC0, 2, 1, true, _hash(1, true)));
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 0);
    }

    function test_ignoresTamperedPolicyHash() public {
        _deliver(_log(ORIGIN_CHAIN, HUB, TOPIC0, 3, 1, true, bytes32(keccak256("tampered"))));
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 0);
    }

    // -- ordering / idempotency ----------------------------------------

    function test_duplicateEventDoesNotRequestSecondCallback() public {
        IReactive.LogRecord memory log_ =
            _log(ORIGIN_CHAIN, HUB, TOPIC0, 3, 2, true, _hash(2, true));
        vm.recordLogs();
        _deliver(log_);
        _deliver(log_);
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 2);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 1);
    }

    function test_oldEpochAfterNewEpochIsIgnored() public {
        _deliver(_log(ORIGIN_CHAIN, HUB, TOPIC0, 3, 3, false, _hash(3, false)));
        _deliver(_log(ORIGIN_CHAIN, HUB, TOPIC0, 3, 1, true, _hash(1, true)));
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 3);
    }

    function test_acceptsStrictlyNewerEpoch() public {
        _deliver(_log(ORIGIN_CHAIN, HUB, TOPIC0, 3, 1, true, _hash(1, true)));
        _deliver(_log(ORIGIN_CHAIN, HUB, TOPIC0, 3, 2, false, _hash(2, false)));
        assertEq(uint256(reactive.latestRequestedEpoch(AGENT_ID)), 2);
    }
}
