export interface StatusBadgeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export function getPdfPrintStyles(statusBadge: StatusBadgeStyle): string {
  return `
    @page { size: A4 portrait; margin: 0mm; }
    *, *:before, *:after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0; padding: 0; color: #0f172a; background: #ffffff;
      font-size: 11.5px; line-height: 1.45;
    }
    table.print-page-layout { width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0; }
    table.print-page-layout > thead { display: table-header-group; }
    table.print-page-layout > tfoot { display: table-footer-group; }
    table.print-page-layout > thead > tr > td,
    table.print-page-layout > tfoot > tr > td,
    table.print-page-layout > tbody > tr > td { border: none; padding: 0; margin: 0; }
    .page-header-spacer, .page-footer-spacer { height: 8mm; }
    .page-container { width: 100%; padding: 0 16mm; box-sizing: border-box; }
    .header-top-row {
      width: 100%; display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 6px; gap: 16px;
    }
    .header-logo-box { flex: 0 0 auto; display: flex; align-items: center; }
    .header-logo-img {
      max-height: 95px; max-width: 320px; width: auto; height: auto;
      object-fit: contain; object-position: left center; display: block;
    }
    .header-title-box { flex: 1 1 auto; text-align: right; }
    .form-title {
      font-size: 20px; font-weight: 900; color: #253C7D; margin: 0;
      letter-spacing: 0.6px; text-transform: uppercase; line-height: 1.1;
    }
    .header-divider { height: 2.5px; background-color: #253C7D; width: 100%; margin: 6px 0 14px 0; }
    .meta-badges-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
    }
    .req-badge {
      font-family: monospace; font-size: 12px; font-weight: 800;
      background: #eef2ff; color: #253C7D; border: 1px solid #c7d2fe;
      padding: 2px 8px; border-radius: 6px;
    }
    .status-pill {
      font-size: 10.5px; font-weight: 800; padding: 2px 10px; border-radius: 9999px;
      background: ${statusBadge.bg}; color: ${statusBadge.text}; border: 1px solid ${statusBadge.border};
    }
    .section-title { font-size: 13px; font-weight: 800; color: #253C7D; margin: 14px 0 6px 0; }
    .info-table {
      width: 100%; border-collapse: collapse; border: 1.5px solid #253C7D;
      margin-bottom: 14px; page-break-inside: avoid;
    }
    .info-table td {
      border: 1px solid #94a3b8; padding: 6px 10px; font-size: 11.5px;
      vertical-align: middle; color: #0f172a;
    }
    .info-table .lbl { font-weight: 700; width: 25%; background-color: #f1f5f9; color: #1e293b; }
    .justification-card {
      background: #f8fafc; border: 1px solid #cbd5e1; border-left: 3.5px solid #f59e0b;
      padding: 8px 12px; border-radius: 4px; margin-bottom: 14px;
      font-size: 11.5px; line-height: 1.5; color: #334155;
    }
    .general-box {
      border: 1.5px solid #253C7D; border-radius: 4px; overflow: hidden;
      font-size: 11.5px; margin-bottom: 16px;
    }
    .box-header {
      padding: 7px 12px; font-weight: 800; font-size: 12.5px; background-color: #f1f5f9;
      color: #253C7D; border-bottom: 1px solid #94a3b8; border-top: 1px solid #94a3b8;
      letter-spacing: 0.2px; page-break-after: avoid; break-after: avoid;
    }
    .box-header:first-child { border-top: none; }
    .box-content { padding: 10px 14px; background-color: #ffffff; color: #334155; line-height: 1.55; }
    .workflow-box {
      border: 1.5px solid #253C7D; border-radius: 4px; margin-bottom: 16px;
      overflow: hidden; page-break-inside: avoid;
    }
    .workflow-grid { width: 100%; border-collapse: collapse; }
    .workflow-grid td {
      border: 1px solid #cbd5e1; padding: 8px 10px; width: 25%;
      vertical-align: top; background: #fafafa;
    }
    .wf-stage-num {
      font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #253C7D;
      margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;
    }
    .wf-status-badge {
      font-size: 9.5px; font-weight: 800; display: inline-block;
      padding: 1px 6px; border-radius: 4px; margin-bottom: 6px;
    }
    .wf-officer-name { font-size: 11px; font-weight: 700; color: #0f172a; line-height: 1.3; }
    .wf-date { font-size: 9.5px; color: #64748b; margin-top: 4px; }
    .approvals-container { margin-top: 20px; page-break-inside: avoid; }
    .approvals-flex { display: flex; justify-content: space-between; margin-top: 16px; }
    .approval-col { width: 46%; text-align: center; }
    .approval-title { font-weight: 800; font-size: 12px; color: #253C7D; margin-bottom: 44px; }
    .khmer-font { font-family: "Khmer OS Battambang", "Siemreap", "DaunPenh", "Khmer OS", sans-serif; }
    .sig-line { border-bottom: 1.5px solid #64748b; width: 85%; margin: 0 auto 8px auto; }
    .role-khmer {
      font-family: "Khmer OS Battambang", "Siemreap", "DaunPenh", "Khmer OS", sans-serif;
      font-size: 12px; font-weight: 700; color: #253C7D; margin-bottom: 2px;
    }
    .role-en { font-size: 11.5px; font-weight: 700; color: #1e293b; }
    .signee-name { font-size: 11.5px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .sig-date { font-size: 11px; color: #64748b; margin-top: 5px; font-weight: 600; }
    .footer-bar {
      margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 6px;
      font-size: 9.5px; color: #94a3b8; display: flex; justify-content: space-between;
      page-break-inside: avoid;
    }
  `;
}
