import { toYMD, todayYMD } from "@/lib/date";

interface DateRangeFilterProps {
  isDateScoped: boolean;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
}

export function DateRangeFilter({ isDateScoped, dateFrom, setDateFrom, dateTo, setDateTo }: DateRangeFilterProps) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-4 ${!isDateScoped ? "opacity-40 pointer-events-none" : ""}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Date Range Filter {!isDateScoped && <span className="normal-case font-normal">(not used by this report)</span>}
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-[#253C7D] hover:underline cursor-pointer w-full text-center">
            Clear dates
          </button>
        )}
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
        Period Presets (Day / Week / Month)
      </p>
      <div className="space-y-2">
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Per Day</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                const t = todayYMD();
                setDateFrom(t);
                setDateTo(t);
              }}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center ${dateFrom === todayYMD() && dateTo === todayYMD()
                  ? "bg-[#253C7D] text-white"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                const y = toYMD(d);
                setDateFrom(y);
                setDateTo(y);
              }}
              className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer text-center"
            >
              Yesterday
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Per Week</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                const now = new Date();
                const day = now.getDay();
                const diffToMon = (day === 0 ? -6 : 1) - day;
                const mon = new Date(now);
                mon.setDate(now.getDate() + diffToMon);
                const sun = new Date(mon);
                sun.setDate(mon.getDate() + 6);
                setDateFrom(toYMD(mon));
                setDateTo(toYMD(sun));
              }}
              className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer text-center"
            >
              This Week
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const day = now.getDay();
                const diffToMon = (day === 0 ? -6 : 1) - day - 7;
                const mon = new Date(now);
                mon.setDate(now.getDate() + diffToMon);
                const sun = new Date(mon);
                sun.setDate(mon.getDate() + 6);
                setDateFrom(toYMD(mon));
                setDateTo(toYMD(sun));
              }}
              className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer text-center"
            >
              Last Week
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Per Month &amp; Year</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                const n = new Date();
                setDateFrom(toYMD(new Date(n.getFullYear(), n.getMonth(), 1)));
                setDateTo(toYMD(new Date(n.getFullYear(), n.getMonth() + 1, 0)));
              }}
              className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer text-center"
            >
              This Month
            </button>
            <button
              onClick={() => {
                const n = new Date();
                setDateFrom(toYMD(new Date(n.getFullYear(), n.getMonth() - 1, 1)));
                setDateTo(toYMD(new Date(n.getFullYear(), n.getMonth(), 0)));
              }}
              className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer text-center"
            >
              Last Month
            </button>
            <button
              onClick={() => {
                setDateFrom("2026-01-01");
                setDateTo(todayYMD());
              }}
              className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer text-center"
            >
              YTD 2026
            </button>
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 transition-colors cursor-pointer text-center"
            >
              All Time
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
