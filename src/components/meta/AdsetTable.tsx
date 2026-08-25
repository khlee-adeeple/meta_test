import type { MetaAdset } from "@/types/meta";

function displayValue(value?: string): string {
  return value === undefined || value === "" ? "-" : value;
}

// 값 자체는 바꾸지 않고, 숫자로 파싱 가능할 때만 천 단위 구분자로 보기 좋게 표시한다.
function displayBudget(value?: string): string {
  if (value === undefined || value === "") return "-";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("ko-KR") : value;
}

const COLUMNS = [
  "광고세트명",
  "광고세트 ID",
  "캠페인 ID",
  "Status",
  "Effective Status",
  "Optimization Goal",
  "일 예산",
  "시작일",
  "종료일",
];

export function AdsetTable({ rows }: { rows: MetaAdset[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500">조회된 광고세트가 없습니다.</p>
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
          {rows.map((row) => (
            <tr key={row.id ?? row.name}>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.name)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.id)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.campaign_id)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.status)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.effective_status)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.optimization_goal)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayBudget(row.daily_budget)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.start_time)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.end_time)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
