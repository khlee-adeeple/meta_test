import type { MetaAction, MetaInsight } from "@/types/meta";

function displayValue(value?: string): string {
  // Meta가 반환하지 않은 필드는 0으로 단정하지 않고 "-"로 표시한다.
  return value === undefined || value === "" ? "-" : value;
}

function ActionsList({ actions }: { actions?: MetaAction[] }) {
  if (!actions || actions.length === 0) return <span>-</span>;

  return (
    <ul className="space-y-0.5">
      {actions.map((action) => (
        <li key={action.action_type} className="whitespace-nowrap">
          {action.action_type}: {action.value ?? "-"}
        </li>
      ))}
    </ul>
  );
}

const COLUMNS = [
  "날짜",
  "캠페인",
  "광고세트",
  "광고",
  "Spend",
  "Impressions",
  "Reach",
  "Clicks",
  "CTR",
  "CPC",
  "CPM",
  "Frequency",
  "Actions",
];

export function InsightTable({ rows }: { rows: MetaInsight[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500">조회된 Insights가 없습니다.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-500"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={`${row.ad_id ?? "row"}-${row.date_start ?? i}`}>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.date_start)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.campaign_name)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.adset_name)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.ad_name)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.spend)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.impressions)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.reach)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.clicks)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.ctr)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.cpc)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.cpm)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.frequency)}
              </td>
              <td className="px-3 py-2">
                <ActionsList actions={row.actions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
