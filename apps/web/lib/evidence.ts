import fs from "node:fs";
import path from "node:path";

export type FlowEvidence = {
  verified: boolean;
  note: string;
  grant?: { source?: string; reactive?: string; callback?: string };
  revoke?: { source?: string; reactive?: string; callback?: string; denial?: string; denialKind?: "revert" | "eth_call" };
  actionSuccess?: string;
  propagationMs?: number;
  measuredAt?: string;
};

const EMPTY: FlowEvidence = {
  verified: false,
  note: "No verified on-chain flow evidence has been recorded yet. Local simulations are not proof of a live callback.",
};

export type DeploymentEvidence = {
  verifiedAt: string;
  reactive: { address: string | null; deployTx: string | null; faucetTx?: string | null; depositTx?: string | null };
  source: { address: string | null; tx: string | null };
  destination: { mirror: string | null; vault: string | null; asset: string | null; tx: string | null };
  note: string;
};

export function readDeployments(): DeploymentEvidence | null {
  try {
    const file = path.join(process.cwd(), "public", "evidence", "deployments.json");
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as DeploymentEvidence;
  } catch {
    return null;
  }
}

export function readEvidence(): FlowEvidence {
  try {
    const file = path.join(process.cwd(), "public", "evidence", "flow.json");
    if (!fs.existsSync(file)) return EMPTY;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as FlowEvidence;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}
