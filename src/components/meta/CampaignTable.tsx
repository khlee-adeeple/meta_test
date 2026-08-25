import type { MetaCampaign } from "@/types/meta";

function displayValue(value?: string): string {
  return value === undefined || value === "" ? "-" : value;
}

const COLUMNS = [
  "캠페인명",
  "캠페인 ID",
  "Objective",
  "Status",
  "Effective Status",
  "생성일",
  "수정일",
];

export function CampaignTable({ rows }: { rows: MetaCampaign[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">조회된 캠페인이 없습니다.</p>;
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
                {displayValue(row.objective)}
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
