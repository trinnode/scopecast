export const STATUS = {
  POLICY_DRAFT: "POLICY_DRAFT",
  SOURCE_TX_SUBMITTED: "SOURCE_TX_SUBMITTED",
  SOURCE_POLICY_ACTIVE: "SOURCE_POLICY_ACTIVE",
  SOURCE_REVOKED: "SOURCE_REVOKED",
  REACTIVE_EVENT_PENDING: "REACTIVE_EVENT_PENDING",
  REACTIVE_EVENT_PROCESSED: "REACTIVE_EVENT_PROCESSED",
  CALLBACK_REQUESTED: "CALLBACK_REQUESTED",
  DESTINATION_POLICY_ACTIVE: "DESTINATION_POLICY_ACTIVE",
  DESTINATION_REVOKED: "DESTINATION_REVOKED",
  CALLBACK_FAILED: "CALLBACK_FAILED",
  DESTINATION_SYNC_UNKNOWN: "DESTINATION_SYNC_UNKNOWN",
} as const;

export type PolicyStatus = (typeof STATUS)[keyof typeof STATUS];

type Tone = "active" | "pending" | "revoked" | "unknown";

export const STATUS_META: Record<PolicyStatus, { tone: Tone; label: string; icon: string }> = {
  POLICY_DRAFT: { tone: "unknown", label: "DRAFT", icon: "○" },
  SOURCE_TX_SUBMITTED: { tone: "pending", label: "SOURCE TX SUBMITTED", icon: "◐" },
  SOURCE_POLICY_ACTIVE: { tone: "active", label: "ACTIVE ON SOURCE", icon: "▶" },
  SOURCE_REVOKED: { tone: "revoked", label: "REVOKED ON SOURCE — PROPAGATION PENDING", icon: "⊘" },
  REACTIVE_EVENT_PENDING: { tone: "pending", label: "REACTIVE EVENT PENDING", icon: "◐" },
  REACTIVE_EVENT_PROCESSED: { tone: "active", label: "REACTIVE EVENT PROCESSED", icon: "▶" },
  CALLBACK_REQUESTED: { tone: "pending", label: "CALLBACK REQUESTED", icon: "◐" },
  DESTINATION_POLICY_ACTIVE: { tone: "active", label: "ACTIVE ON DESTINATION", icon: "▶" },
  DESTINATION_REVOKED: { tone: "revoked", label: "REVOKED ON DESTINATION", icon: "⊘" },
  CALLBACK_FAILED: { tone: "revoked", label: "CALLBACK FAILED", icon: "!" },
  DESTINATION_SYNC_UNKNOWN: { tone: "unknown", label: "DESTINATION SYNC UNKNOWN", icon: "?" },
};

export function toneClasses(tone: Tone) {
  switch (tone) {
    case "active":
      return { text: "text-cyan", bg: "bg-tint-active", border: "border-cyan/60", rail: "border-l-2 border-cyan" };
    case "pending":
      return { text: "text-amber", bg: "bg-tint-pending", border: "border-amber/60", rail: "border-l-2 border-dashed border-amber" };
    case "revoked":
      return { text: "text-vermilion", bg: "bg-tint-revoked", border: "border-vermilion/60", rail: "border-l-[3px] border-double border-vermilion" };
    default:
      return { text: "text-fog", bg: "bg-tint-unknown", border: "border-fog/60", rail: "border-l border-dotted border-fog" };
  }
}

export function deriveStatus(sourceActive: boolean | null, destEpoch: number | null, sourceEpoch: number | null): PolicyStatus {
  if (sourceActive === null) return STATUS.DESTINATION_SYNC_UNKNOWN;
  if (destEpoch === null) return STATUS.DESTINATION_SYNC_UNKNOWN;
  if (sourceEpoch !== null && destEpoch < sourceEpoch) {
    return sourceActive ? STATUS.REACTIVE_EVENT_PENDING : STATUS.SOURCE_REVOKED;
  }
  if (destEpoch === sourceEpoch) {
    return sourceActive ? STATUS.DESTINATION_POLICY_ACTIVE : STATUS.DESTINATION_REVOKED;
  }
  return STATUS.DESTINATION_SYNC_UNKNOWN;
}
