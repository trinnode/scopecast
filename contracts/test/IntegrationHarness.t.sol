// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { Vm, MiniTest } from "./MiniTest.sol";
import { IReactive } from "@reactive/src/interfaces/IReactive.sol";
import { IPayable } from "@reactive/src/interfaces/IPayable.sol";
import { PolicyHub } from "../src/PolicyHub.sol";
import { ScopeCastReactive } from "../src/ScopeCastReactive.sol";
import { PolicyMirror } from "../src/PolicyMirror.sol";
import { GuardedDeFiVault } from "../src/GuardedDeFiVault.sol";
import { MockAsset } from "../src/MockAsset.sol";

/// @notice LOCAL HARNESS ONLY. This emulates the callback delivery by calling
///         the mirror through a stub proxy. It is not evidence of a live
///         Reactive transaction; only deployed testnet receipts are.
contract IntegrationHarnessTest is MiniTest {
    address constant SYSTEM = address(0x8888888888888888888888888888888888888888);
    address payable constant PROXY = payable(address(0xC0FFEE));
    uint256 constant ORIGIN_CHAIN = 84532;
    uint256 constant DEST_CHAIN = 1301;
    uint256 constant TOPIC0 = 0xd1601cdc83fb90b6c3071dcd453f6433b966853b9b306aeb31c20c74ebedd8c9;
    address constant OWNER = address(0x0A11CE);
    address constant AGENT_KEY = address(0x7777);
    bytes32 constant AGENT_ID = keccak256("Northstar Rebalance Agent");
    bytes4 constant SELECTOR = bytes4(keccak256("rebalance(bytes32,uint256)"));

    PolicyHub hub;
    ScopeCastReactive reactive;
    PolicyMirror mirror;
    GuardedDeFiVault vault;
    MockAsset asset;

    function setUp() public {
        vm.chainId(DEST_CHAIN);
        vm.warp(1_800_000_000);
        vm.etch(SYSTEM, hex"60006000f3");
        vm.etch(PROXY, hex"60006000f3");

        vm.prank(OWNER);
        mirror = new PolicyMirror(IPayable(PROXY), address(reactivePredicted()), OWNER, address(0));
        vm.prank(OWNER);
        asset = new MockAsset();
        vm.prank(OWNER);
        vault = new GuardedDeFiVault(address(mirror), address(asset));
        vm.prank(OWNER);
        mirror.setModuleApproval(address(vault), true);

        vm.prank(OWNER);
        hub = new PolicyHub(DEST_CHAIN, address(vault));

        vm.prank(OWNER);
        reactive = new ScopeCastReactive(
            ORIGIN_CHAIN, address(hub), TOPIC0, DEST_CHAIN, address(vault), 300_000
        );
        vm.prank(OWNER);
        reactive.setDestinationMirror(address(mirror));

        asset.mint(OWNER, 100 ether);
        vm.prank(OWNER);
        asset.approve(address(vault), 100 ether);
        vm.prank(OWNER);
        vault.seed(50 ether);
    }

    /// @dev Placeholder needed because the mirror's reactive sender is
    ///      immutable and deployed before the reactive contract. In the local
    ///      harness we use this address and etch stubs for both providers.
    function reactivePredicted() internal pure returns (address) {
        return address(0x5150);
    }

    function _deliverLatestHubEvent(uint64 expectedEpoch) internal {
        Vm.Log memory log_ = _latestHubLog();
        uint64 epoch = uint64(uint256(log_.topics[3]));
        assertEq(uint256(epoch), uint256(expectedEpoch));

        IReactive.LogRecord memory record = IReactive.LogRecord({
            chainId: ORIGIN_CHAIN,
            contractAddress: address(hub),
            topic0: uint256(log_.topics[0]),
            topic1: uint256(log_.topics[1]),
            topic2: uint256(log_.topics[2]),
            topic3: uint256(log_.topics[3]),
            data: log_.data,
            blockNumber: 1,
            opCode: 3,
            blockHash: 0,
            txHash: 0,
            logIndex: 0
        });

        vm.recordLogs();
        vm.prank(SYSTEM);
        reactive.react(record);
        Vm.Log[] memory reactiveLogs = vm.getRecordedLogs();
        assertEq(reactiveLogs.length, 1);
        assertEq(reactiveLogs[0].topics[0], ScopeCastReactive.PolicyAccepted.selector);

        // Decode exactly what the reactive contract put in the callback payload.
        (,,, bytes memory payload) =
            abi.decode(reactiveLogs[0].data, (bool, bytes32, uint256, bytes));
        // `abi.encodeWithSignature` payload: selector + 11 head words.
        (
            address injected,
            bytes32 agentId,
            address agent,
            uint64 epoch_,
            uint256 chain,
            address module,
            bytes4 selector,
            uint256 cap,
            uint64 expiry,
            bool active,
            bytes32 policyHash
        ) = abi.decode(
            _slicePayload(payload),
            (
                address,
                bytes32,
                address,
                uint64,
                uint256,
                address,
                bytes4,
                uint256,
                uint64,
                bool,
                bytes32
            )
        );
        assertEq(injected, address(0)); // placeholder replaced by the network in production

        // Emulate the authenticated network delivery in this local harness.
        vm.prank(PROXY);
        mirror.applyPolicy(
            reactivePredicted(),
            agentId,
            agent,
            epoch_,
            chain,
            module,
            selector,
            cap,
            expiry,
            active,
            policyHash
        );
    }

    function _latestHubLog() internal view returns (Vm.Log memory) {
        // Read the most recent PolicyUpdated log from the hub via a fresh
        // eth_getLogs-style query is not available in a unit test, so the
        // caller records logs around the transaction and stores them here.
        return _storedLog;
    }

    Vm.Log internal _storedLog;

    function _recordHubAction() internal {
        vm.recordLogs();
    }

    function _captureHubLog() internal {
        Vm.Log[] memory logs = vm.getRecordedLogs();
        _storedLog = logs[logs.length - 1];
    }

    function _slicePayload(bytes memory payload_) internal pure returns (bytes memory) {
        bytes memory out = new bytes(payload_.length - 4);
        for (uint256 i = 0; i < out.length; i++) {
            out[i] = payload_[i + 4];
        }
        return out;
    }

    function testFullLifecycleLocally() public {
        _recordHubAction();
        vm.prank(OWNER);
        hub.createPolicy(AGENT_ID, AGENT_KEY, SELECTOR, 10 ether, uint64(block.timestamp + 3600));
        _captureHubLog();
        _deliverLatestHubEvent(1);
        assertEq(mirror.getPolicy(AGENT_ID).active, true);

        vm.prank(AGENT_KEY);
        vault.rebalance(AGENT_ID, 4 ether);
        (, uint256 strategy) = vault.positions();
        assertEq(strategy, 4 ether);

        _recordHubAction();
        vm.prank(OWNER);
        hub.revokePolicy(AGENT_ID);
        _captureHubLog();
        _deliverLatestHubEvent(2);
        assertEq(mirror.getPolicy(AGENT_ID).active, false);

        vm.prank(AGENT_KEY);
        vm.expectRevert(GuardedDeFiVault.AgentPolicyInactive.selector);
        vault.rebalance(AGENT_ID, 4 ether);
        (, uint256 strategyAfter) = vault.positions();
        assertEq(strategyAfter, 4 ether); // settled action is not reversed
    }
}
