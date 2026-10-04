export function SummaryCards({ summary }: { summary: Record<string, string | number> }) {
  if (Object.keys(summary).length === 0) return null;
  return (
    <div className={`grid gap-3 grid-cols-2 md:grid-cols-${Math.min(Object.keys(summary).length, 4)}`}>
      {Object.entries(summary).map(([k, v]) => {
        const isDel = k.includes("Deleted");
        return (
          <div
            key={k}
            className={`bg-white border rounded-xl p-3.5 shadow-2xs transition-all hover:shadow-xs ${
              isDel ? "border-rose-200 bg-rose-50/20" : "border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDel ? "text-rose-600" : "text-gray-400"}`}>
                {k}
              </p>
              {isDel && <i className="ri-delete-bin-7-line text-rose-500 text-sm" />}
            </div>
            <p className={`text-2xl font-bold tracking-tight mt-1 ${isDel ? "text-rose-700" : "text-gray-900"}`}>
              {v}
            </p>
          </div>
        );
      })}
    </div>
  );
}
