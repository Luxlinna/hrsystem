import { memo } from "react";
import type { ComplaintSuggestion } from "../types";
import { ComplaintDetailMetrics } from "./ComplaintDetailMetrics";
import { ComplaintDetailContent } from "./ComplaintDetailContent";
import { ComplaintKeyPointsCard } from "./ComplaintKeyPointsCard";

interface ComplaintDetailBodyProps {
  item: ComplaintSuggestion;
  onPreviewAttachment: (url: string, name: string) => void;
}

export const ComplaintDetailBody = memo(function ComplaintDetailBody({
  item,
  onPreviewAttachment,
}: ComplaintDetailBodyProps) {
  return (
    <div className="overflow-y-auto overflow-x-hidden p-5 space-y-4 flex-1 text-xs font-sans min-h-0 bg-[#f8fafc]/50">
      {/* Top 5 Metric Cards */}
      <ComplaintDetailMetrics item={item} />

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Detail & Suggestions */}
        <div className="lg:col-span-8">
          <ComplaintDetailContent item={item} />
        </div>

        {/* Right Side: Key Points & Attachment */}
        <div className="lg:col-span-4">
          <ComplaintKeyPointsCard item={item} onPreviewAttachment={onPreviewAttachment} />
        </div>
      </div>
    </div>
  );
});
