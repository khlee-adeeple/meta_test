import type { ReactNode } from "react";
import type { MetaAdAccount } from "@/types/meta";

// https://developers.facebook.com/docs/marketing-api/reference/ad-account#fields (account_status)
const ACCOUNT_STATUS_LABELS: Record<number, string> = {
  1: "ACTIVE",
  2: "DISABLED",
  3: "UNSETTLED",
  7: "PENDING_RISK_REVIEW",
  8: "PENDING_SETTLEMENT",
  9: "IN_GRACE_PERIOD",
  100: "PENDING_CLOSURE",
  101: "CLOSED",
  201: "ANY_ACTIVE",
  202: "ANY_CLOSED",
};

function formatAccountStatus(status?: number): string {
  if (status === undefined) return "-";
  return ACCOUNT_STATUS_LABELS[status] ?? `UNKNOWN(${status})`;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function MetaAccountCard({ account }: { account: MetaAdAccount }) {
  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-base font-semibold text-gray-900">광고계정</h3>
      <Row label="계정명" value={account.name ?? "-"} />
      <Row label="계정 ID" value={account.account_id ?? "-"} />
      <Row
        label="상태"
        value={
          <span>
            {formatAccountStatus(account.account_status)}{" "}
            {account.account_status !== undefined && (
              <span className="text-xs text-gray-400">
                ({account.account_status})
              </span>
            )}
          </span>
        }
      />
      <Row label="통화" value={account.currency ?? "-"} />
      <Row label="시간대" value={account.timezone_name ?? "-"} />
    </div>
  );
}
