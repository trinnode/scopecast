export const policyHubAbi = [
  {
    type: "function",
    name: "createPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "agent", type: "address" },
      { name: "allowedSelector", type: "bytes4" },
      { name: "maxValue", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updatePolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "agent", type: "address" },
      { name: "allowedSelector", type: "bytes4" },
      { name: "maxValue", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokePolicy",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "rotateAgentKey",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "newAgent", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getPolicy",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "agent", type: "address" },
          { name: "destinationChainId", type: "uint256" },
          { name: "destinationModule", type: "address" },
          { name: "allowedSelector", type: "bytes4" },
          { name: "maxValue", type: "uint256" },
          { name: "expiresAt", type: "uint64" },
          { name: "epoch", type: "uint64" },
          { name: "active", type: "bool" },
          { name: "policyHash", type: "bytes32" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "expectedDestinationChainId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "expectedDestinationModule",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "PolicyUpdated",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "epoch", type: "uint64", indexed: true },
      { name: "destinationChainId", type: "uint256", indexed: false },
      { name: "destinationModule", type: "address", indexed: false },
      { name: "allowedSelector", type: "bytes4", indexed: false },
      { name: "maxValue", type: "uint256", indexed: false },
      { name: "expiresAt", type: "uint64", indexed: false },
      { name: "active", type: "bool", indexed: false },
      { name: "policyHash", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const mirrorAbi = [
  {
    type: "function",
    name: "getPolicy",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "agent", type: "address" },
          { name: "destinationChainId", type: "uint256" },
          { name: "destinationModule", type: "address" },
          { name: "allowedSelector", type: "bytes4" },
          { name: "maxValue", type: "uint256" },
          { name: "expiresAt", type: "uint64" },
          { name: "epoch", type: "uint64" },
          { name: "active", type: "bool" },
          { name: "policyHash", type: "bytes32" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "latestEpoch",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint64" }],
  },
  { type: "function", name: "reactiveSender", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "admin", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  {
    type: "event",
    name: "PolicyMirrored",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "epoch", type: "uint64", indexed: true },
      { name: "agent", type: "address", indexed: false },
      { name: "active", type: "bool", indexed: false },
      { name: "policyHash", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const vaultAbi = [
  {
    type: "function",
    name: "rebalance",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "positions",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "idle", type: "uint256" },
      { name: "strategy", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "mirror",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "ActionExecuted",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "epoch", type: "uint64", indexed: false },
      { name: "holdings", type: "uint256", indexed: false },
      { name: "deployed", type: "uint256", indexed: false },
    ],
  },
] as const;
