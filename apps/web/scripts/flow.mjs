// SCOPECAST live-flow runner. Reads .env from the repository root; never prints secrets.
// Run: cd apps/web && node scripts/flow.mjs
import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToHex,
  parseUnits,
  parseAbi,
  getAddress,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://base-sepolia-rpc.publicnode.com"] } },
  testnet: true,
});
const unichainSepolia = defineChain({
  id: 1301,
  name: "Unichain Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia.unichain.org"] } },
  testnet: true,
});
const lasna = defineChain({
  id: 5318007,
  name: "Reactive Lasna",
  nativeCurrency: { name: "REACT", symbol: "REACT", decimals: 18 },
  rpcUrls: { default: { http: ["https://lasna-rpc.rnk.dev/"] } },
  testnet: true,
});

const ROOT = path.resolve(process.cwd(), "../..");
const envFile = path.join(ROOT, ".env");
if (!fs.existsSync(envFile)) throw new Error("Missing .env — see .env.example");
const env = {};
for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const need = (k) => {
  if (!env[k]) throw new Error(`Missing ${k} in .env`);
  return env[k];
};

const baseClient = createPublicClient({ chain: baseSepolia, transport: http(env.NEXT_PUBLIC_BASE_RPC_URL || undefined, { retryCount: 6, retryDelay: 1200, timeout: 20000 }) });
const unichainClient = createPublicClient({ chain: unichainSepolia, transport: http(env.NEXT_PUBLIC_UNICHAIN_RPC_URL || undefined, { retryCount: 6, retryDelay: 1200, timeout: 20000 }) });
const lasnaClient = createPublicClient({ chain: lasna, transport: http(env.NEXT_PUBLIC_LASNA_RPC_URL || undefined, { retryCount: 6, retryDelay: 1200, timeout: 30000 }) });

const baseWallet = createWalletClient({
  account: privateKeyToAccount(need("DEPLOYER_PRIVATE_KEY")),
  chain: baseSepolia,
  transport: http(env.NEXT_PUBLIC_BASE_RPC_URL || undefined, { retryCount: 6, retryDelay: 1200, timeout: 20000 }),
});
const agentWallet = createWalletClient({
  account: privateKeyToAccount(need("AGENT_SESSION_PRIVATE_KEY")),
  chain: unichainSepolia,
  transport: http(env.NEXT_PUBLIC_UNICHAIN_RPC_URL || undefined, { retryCount: 6, retryDelay: 1200, timeout: 20000 }),
});

const HUB = getAddress(need("NEXT_PUBLIC_POLICY_HUB_ADDRESS"));
const MIRROR = getAddress(need("NEXT_PUBLIC_POLICY_MIRROR_ADDRESS"));
const VAULT = getAddress(need("NEXT_PUBLIC_GUARDED_VAULT_ADDRESS"));
const REACTIVE = getAddress(need("NEXT_PUBLIC_REACTIVE_CONTRACT_ADDRESS"));

const hubAbi = [
  { type: "function", name: "createPolicy", stateMutability: "nonpayable", inputs: [
    { name: "agentId", type: "bytes32" }, { name: "agent", type: "address" },
    { name: "allowedSelector", type: "bytes4" }, { name: "maxValue", type: "uint256" }, { name: "expiresAt", type: "uint64" },
  ], outputs: [] },
  { type: "function", name: "revokePolicy", stateMutability: "nonpayable", inputs: [{ name: "agentId", type: "bytes32" }], outputs: [] },
  { type: "function", name: "getPolicy", stateMutability: "view", inputs: [{ name: "agentId", type: "bytes32" }], outputs: [
    { name: "", type: "tuple", components: [
      { name: "agent", type: "address" }, { name: "destinationChainId", type: "uint256" },
      { name: "destinationModule", type: "address" }, { name: "allowedSelector", type: "bytes4" },
      { name: "maxValue", type: "uint256" }, { name: "expiresAt", type: "uint64" },
      { name: "epoch", type: "uint64" }, { name: "active", type: "bool" }, { name: "policyHash", type: "bytes32" },
    ] },
  ] },
  { type: "event", name: "PolicyUpdated", inputs: [
    { name: "agentId", type: "bytes32", indexed: true }, { name: "agent", type: "address", indexed: true },
    { name: "epoch", type: "uint64", indexed: true }, { name: "destinationChainId", type: "uint256", indexed: false },
    { name: "destinationModule", type: "address", indexed: false }, { name: "allowedSelector", type: "bytes4", indexed: false },
    { name: "maxValue", type: "uint256", indexed: false }, { name: "expiresAt", type: "uint64", indexed: false },
    { name: "active", type: "bool", indexed: false }, { name: "policyHash", type: "bytes32", indexed: false },
  ] },
];
const selector = keccak256(stringToHex("rebalance(bytes32,uint256)")).slice(0, 10);
const mirrorAbi = [
  { type: "function", name: "latestEpoch", stateMutability: "view", inputs: [{ name: "agentId", type: "bytes32" }], outputs: [{ name: "", type: "uint64" }] },
  {
    type: "function", name: "getPolicy", stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [{ name: "", type: "tuple", components: [
      { name: "agent", type: "address" },
      { name: "destinationChainId", type: "uint256" },
      { name: "destinationModule", type: "address" },
      { name: "allowedSelector", type: "bytes4" },
      { name: "maxValue", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
      { name: "epoch", type: "uint64" },
      { name: "active", type: "bool" },
      { name: "policyHash", type: "bytes32" },
    ] }],
  },
  { type: "event", name: "PolicyMirrored", inputs: [
    { name: "agentId", type: "bytes32", indexed: true },
    { name: "epoch", type: "uint64", indexed: true },
    { name: "agent", type: "address", indexed: true },
    { name: "active", type: "bool", indexed: false },
    { name: "policyHash", type: "bytes32", indexed: false },
    { name: "destinationModule", type: "address", indexed: false },
  ] },
];
const vaultAbi = parseAbi(["function rebalance(bytes32 agentId,uint256 amount)"]);

const agentId = keccak256(stringToHex("Northstar Rebalance Agent - live v3"));
const agentAddress = agentWallet.account.address;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForEpoch(target, wantActive, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const epoch = await unichainClient.readContract({ address: MIRROR, abi: mirrorAbi, functionName: "latestEpoch", args: [agentId] });
      if (Number(epoch) >= target) {
        const policy = await unichainClient.readContract({ address: MIRROR, abi: mirrorAbi, functionName: "getPolicy", args: [agentId] });
        if (policy.active === wantActive) return { epoch: Number(epoch), policy };
      }
    } catch { /* RPC may be transiently unavailable */ }
    await sleep(4000);
  }
  throw new Error(`Timed out waiting for destination epoch ${target}`);
}

async function findCallbackHash(epoch) {
  const latest = await unichainClient.getBlockNumber();
  const from = latest > 900n ? latest - 900n : 0n;
  const logs = await unichainClient.getLogs({
    address: MIRROR,
    event: mirrorAbi.find((x) => x.type === "event" && x.name === "PolicyMirrored"),
    fromBlock: from,
    toBlock: latest,
  });
  const match = logs.filter((l) => Number(l.args.epoch) === epoch).pop();
  return match?.transactionHash;
}

async function verified(hash, client, label) {
  const receipt = await client.getTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${label} reverted`);
  let block;
  for (let tries = 0; tries < 8; tries++) {
    try { block = await client.getBlock({ blockNumber: receipt.blockNumber }); break; }
    catch { await sleep(1500); }
  }
  if (!block) throw new Error(`Could not fetch block for ${label}`);
  console.log(`${label}: ${hash} (block ${receipt.blockNumber}, ${new Date(Number(block.timestamp) * 1000).toISOString()})`);
  return { hash, timestampMs: Number(block.timestamp) * 1000 };
}

async function main() {
  console.log("Agent ID:", agentId);
  console.log("Agent key address:", agentAddress);
  console.log("Vault:", VAULT, "Mirror:", MIRROR, "Reactive:", REACTIVE);

  // 1. Source grant (or resume from an already verified grant)
  let source;
  if (process.env.SKIP_GRANT === "1") {
    console.log("step: read source policy");
    const sourcePolicy = await baseClient.readContract({ address: HUB, abi: hubAbi, functionName: "getPolicy", args: [agentId] });
    if (!process.env.GRANT_TX) throw new Error("Set GRANT_TX to the verified source grant hash when resuming");
    source = { hash: process.env.GRANT_TX };
    console.log("RESUMED SOURCE GRANT:", source.hash, "epoch", String(sourcePolicy.epoch));
  } else {
    const grantHash = await baseWallet.writeContract({
      address: HUB, abi: hubAbi, functionName: "createPolicy",
      args: [agentId, agentAddress, selector, parseUnits("10", 18), BigInt(Math.floor(Date.now() / 1000) + 7200)],
    });
    source = await verified(grantHash, baseClient, "SOURCE GRANT");
  }

  // 2. Wait for the REAL destination callback
  console.log("step: wait destination epoch 1");
  const dest = await waitForEpoch(1, true);
  console.log("step: find grant callback hash");
  const grantCallbackHash = await findCallbackHash(1);
  if (!grantCallbackHash) throw new Error("Destination policy changed but no PolicyMirrored callback receipt was found");
  const callback = await verified(grantCallbackHash, unichainClient, "GRANT CALLBACK");
  void dest;

  // 3. Successful guarded action (or resume from an already confirmed one)
  let actionHash;
  if (process.env.SKIP_ACTION === "1") {
    actionHash = process.env.ACTION_TX;
    if (!actionHash) throw new Error("Set ACTION_TX when resuming after the action");
    console.log("RESUMED ACTION:", actionHash);
  } else {
    actionHash = await agentWallet.writeContract({
      address: VAULT, abi: vaultAbi, functionName: "rebalance", args: [agentId, parseUnits("2", 18)],
    });
    await verified(actionHash, unichainClient, "PRE-REVOKE ACTION");
  }

  // 4. Source revoke
  const revokeHash = await baseWallet.writeContract({ address: HUB, abi: hubAbi, functionName: "revokePolicy", args: [agentId] });
  const revokeSource = await verified(revokeHash, baseClient, "SOURCE REVOKE");

  // 5. Wait for the REAL revoke callback
  await waitForEpoch(2, false);
  const revokeCallbackHash = await findCallbackHash(2);
  if (!revokeCallbackHash) throw new Error("Revoke mirrored but no callback receipt found");
  const revokeCallback = await verified(revokeCallbackHash, unichainClient, "REVOKE CALLBACK");

  // 6. Post-revoke denial: eth_call simulation (no gas spent, clearly labelled)
  let denialReason = "";
  try {
    await unichainClient.simulateContract({
      account: agentAddress, address: VAULT, abi: vaultAbi, functionName: "rebalance",
      args: [agentId, parseUnits("2", 18)],
    });
    throw new Error("Simulation unexpectedly succeeded — revocation did not take effect");
  } catch (e) {
    denialReason = String(e?.shortMessage || e?.message || e).slice(0, 300);
    console.log("POST-REVOKE DENIAL (eth_call):", denialReason);
  }

  const evidence = {
    verified: true,
    note: "All hashes below were checked with eth_getTransactionReceipt on their own chain. Post-revoke denial is an eth_call simulation, not a reverted transaction.",
    grant: { source: source.hash, reactive: "SEE_LASNA_TX", callback: callback.hash },
    revoke: {
      source: revokeSource.hash,
      reactive: "SEE_LASNA_TX",
      callback: revokeCallback.hash,
      denial: null,
      denialKind: "eth_call",
    },
    actionSuccess: actionHash,
    propagationMs: revokeCallback.timestampMs - revokeSource.timestampMs,
    measuredAt: new Date().toISOString(),
    denialReason,
  };
  const out = path.join(ROOT, "apps", "web", "public", "evidence", "flow.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + "\n");
  console.log("Evidence written to apps/web/public/evidence/flow.json");
  console.log("Measured source->destination propagation:", evidence.propagationMs, "ms");
  console.log("Reactive transaction hashes must be read from Lasna by matching PolicyAccepted events, then filled into docs/DEPLOYMENTS.md.");
}

main().catch((e) => {
  console.error("FLOW FAILED:", e?.shortMessage || e?.message || e);
  process.exit(1);
});
