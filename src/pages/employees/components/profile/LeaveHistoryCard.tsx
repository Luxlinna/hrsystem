import { memo } from "react";

interface LeaveHistoryCardProps {
  leaveRequests: any[];
}

export const LeaveHistoryCard = memo(function LeaveHistoryCard({
  leaveRequests,
}: LeaveHistoryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Leave History</h2>
      {leaveRequests.length > 0 ? (
        <div className="border border-gray-100 rounded-xl overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-4 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span>Type</span>
              <span>Dates</span>
              <span>Status</span>
              <span>Requested</span>
            </div>
            {leaveRequests.map((l) => (
              <div key={l.id} className="grid grid-cols-4 px-4 py-3 border-t border-gray-50 text-[13px]">
                <span className="capitalize">{l.leave_type}</span>
                <span className="text-gray-600">
                  {l.start_date?.slice(5)} - {l.end_date?.slice(5)}
                </span>
                <span
                  className={`capitalize font-medium ${
                    l.status === "approved"
                      ? "text-green-600"
                      : l.status === "pending"
                      ? "text-amber-600"
                      : "text-red-500"
                  }`}
                >
                  {l.status}
                </span>
                <span className="text-gray-500">{new Date(l.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-gray-400">No leave requests on record.</p>
      )}
    </div>
  );
});
