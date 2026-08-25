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

// breakdown 조회일 때만 채워지는 차원. 실제로 값이 있는 컬럼만 테이블에 추가한다.
const BREAKDOWN_DIMENSIONS = [
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "publisher_platform", label: "Platform" },
  { key: "platform_position", label: "Placement" },
] as const;

const BASE_COLUMNS = ["날짜", "캠페인", "광고세트", "광고"];
const METRIC_COLUMNS = [
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

  const activeDimensions = BREAKDOWN_DIMENSIONS.filter((dim) =>
    rows.some((row) => row[dim.key] !== undefined)
  );

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              ...BASE_COLUMNS,
              ...activeDimensions.map((d) => d.label),
              ...METRIC_COLUMNS,
            ].map((col) => (
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
            <tr key={`${row.ad_id ?? "row"}-${row.date_start ?? i}-${i}`}>
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
              {activeDimensions.map((dim) => (
                <td key={dim.key} className="whitespace-nowrap px-3 py-2">
                  {displayValue(row[dim.key])}
                </td>
              ))}
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
