export function renderSignatoryBox(
  title: string,
  assignedName: string,
  sigData?: {
    comment?: string | null;
    checked_by?: string | null;
    status: string;
    signed_at?: string | null;
  }
): string {
  const isApproved = sigData?.status === "approved";
  const comment = sigData?.comment || "";
  const dateStr = sigData?.signed_at
    ? new Date(sigData.signed_at).toLocaleDateString("en-GB")
    : "____/_____/_____";

  return `
    <div style="flex: 1; border-right: 1px solid #111; padding: 6px 8px; display: flex; flex-direction: column; justify-content: space-between; font-size: 10px;">
      <div>
        <div style="font-weight: bold; text-decoration: underline; margin-bottom: 3px;">Comment:</div>
        <div style="min-height: 40px; font-size: 9.5px; color: ${comment ? "#111" : "#777"}; line-height: 1.3;">
          ${comment || "…………………………………"}
        </div>
        <div style="margin-top: 6px; font-weight: bold; text-decoration: underline;">Checked by:</div>
        <div style="min-height: 26px; display: flex; align-items: flex-end; padding-bottom: 2px;">
          <div style="width: 100%; border-bottom: 1px dashed #444; font-family: 'Segoe Script', cursive, sans-serif; font-size: 11px; color: #1e3a8a;">
            ${isApproved ? (sigData?.checked_by || assignedName) : "&nbsp;"}
          </div>
        </div>
      </div>
      <div style="margin-top: 10px; text-align: center;">
        <div style="font-weight: bold; font-size: 10.5px; margin-bottom: 2px;">${assignedName}</div>
        <div style="font-size: 9.5px; color: #222; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 9.5px; font-weight: bold;">Date: <span style="font-weight: normal;">${dateStr}</span></div>
      </div>
    </div>
  `;
}
