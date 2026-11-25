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
