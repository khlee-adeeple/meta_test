import type { MetaAd } from "@/types/meta";

function displayValue(value?: string): string {
  return value === undefined || value === "" ? "-" : value;
}

const COLUMNS = [
  "광고명",
  "광고 ID",
  "캠페인 ID",
  "광고세트 ID",
  "Status",
  "Effective Status",
  "생성일",
  "수정일",
];

export function AdTable({ rows }: { rows: MetaAd[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">조회된 광고가 없습니다.</p>;
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
                {displayValue(row.adset_id)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.status)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.effective_status)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.created_time)}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {displayValue(row.updated_time)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
