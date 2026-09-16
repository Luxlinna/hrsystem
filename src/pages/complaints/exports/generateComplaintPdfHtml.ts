import type { ComplaintSuggestion } from "../types";
import { formatDateDMY, formatMultilinePreview } from "@/pages/disciplinary/utils/formatters";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateComplaintPdfHtml(item: ComplaintSuggestion, branchName?: string | null): string {
  const formattedDate = formatDateDMY(item.entry_date);
  const targetCategory = item.target_category || "Business Unit";
  const refCode = `CS-${item.id.slice(0, 8).toUpperCase()}`;
  const buName = branchName || item.branches?.name || "Business Unit";
  const suggestionText = item.suggestion ? formatMultilinePreview(item.suggestion) : null;
  const remarkText = item.remark ? formatMultilinePreview(item.remark) : null;
  const statusColor = item.status === "resolved" ? "#0d9488"
    : item.status === "dismissed" ? "#64748b"
    : item.status === "in_review" ? "#d97706" : "#1e40af";

  const submitterText =
    item.show_identity === false
      ? "Anonymous (Identity Protected / អនាមិក)"
      : item.employees
      ? `${item.employees.first_name} ${item.employees.last_name} (${item.employees.role || "Staff"} • ${item.employees.department || "General"})`
      : item.recorded_by || "Employee";

  const detailText = formatMultilinePreview(item.details);

  return `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8">
  <title>Complaint_Report_${refCode}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,300..700;1,300..700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,300..700;1,300..700&family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b; background: #f8fafc; line-height: 1.8; font-size: 12px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .top-banner {
      position: sticky; top: 0; z-index: 9999; background: #0f172a; color: #ffffff;
      padding: 12px 24px; display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .btn-print { background: #0284c7; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
    .btn-close { background: #334155; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; margin-left: 8px; }
    .page-container { max-width: 860px; margin: 20px auto; background: #ffffff; padding: 36px 44px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-radius: 8px; }
    .doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 24px; }
    .doc-title { font-size: 18px; font-weight: 800; color: #0f172a; }
    .doc-subtitle { font-size: 12px; color: #0284c7; font-weight: 700; margin-top: 2px; }
    .doc-ref { text-align: right; font-size: 11px; color: #64748b; line-height: 1.6; }
    .section-header { font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; margin-top: 20px; }
    .section-divider { border-bottom: 1px solid #e2e8f0; margin-bottom: 14px; }
    .kv-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .kv-table td { padding: 7px 0; vertical-align: top; }
    .kv-lbl { width: 260px; color: #475569; font-weight: 500; padding-right: 14px; }
    .kv-val { color: #0f172a; line-height: 1.85; font-weight: 500; }
    .content-lbl { font-size: 11.5px; font-weight: 600; color: #475569; margin-top: 14px; margin-bottom: 3px; }
    .content-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #f8fafc; white-space: pre-line; word-break: break-word; line-height: 1.85; font-size: 11.5px; }
    .content-box.suggestion { border-color: #fde68a; background: #fffbeb; }
    .content-box.remark { border-color: #bfdbfe; background: #eff6ff; }
    .attachment-row { display: flex; gap: 20px; font-size: 11.5px; padding: 6px 0; }
    .attachment-lbl { width: 246px; color: #475569; font-weight: 500; flex-shrink: 0; }
    .file-bar { flex: 1; border-bottom: 2px solid #22c55e; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center; color: #1e293b; font-weight: 600; font-size: 11px; }
    .signatures-block { margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; text-align: center; page-break-inside: avoid; }
    .sig-line { margin-top: 48px; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; font-weight: 700; color: #1e293b; }
    .sig-role { font-size: 10px; color: #64748b; margin-top: 1px; }
    @page { size: A4 portrait; margin: 0 !important; }
    @media print {
      html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-container { margin: 0 !important; padding: 14mm 16mm !important; box-shadow: none !important; max-width: 100% !important; width: 100% !important; border-radius: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="top-banner no-print">
    <div><strong>Complaint &amp; Suggestion Report</strong> &bull; ${escapeHtml(refCode)} &bull; ${escapeHtml(buName)}</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="page-container">
    <!-- Header -->
    <div class="doc-header">
      <div>
        <div class="doc-title">COMPLAINT &amp; SUGGESTION REPORT</div>
        <div class="doc-subtitle">របាយការណ៍បណ្តឹង និងសំណូមពរ &bull; ${escapeHtml(buName)}</div>
      </div>
      <div class="doc-ref">
        <div><strong>Ref / លេខយោង:</strong> ${escapeHtml(refCode)}</div>
        <div><strong>Date / កាលបរិច្ឆេទ:</strong> ${escapeHtml(formattedDate)}</div>
        <div><strong>Status / ស្ថានភាព:</strong> <span style="color: ${statusColor}; font-weight: 800;">${escapeHtml(item.status.toUpperCase().replace(/_/g, " "))}</span></div>
      </div>
    </div>

    <!-- 1. RECIPIENT & SENDER INFO -->
    <div class="section-header">1. RECIPIENT &amp; SENDER INFORMATION / ព័ត៌មានអ្នកទទួល និងអ្នកដាក់ពាក្យ</div>
    <div class="section-divider"></div>
    <table class="kv-table">
      <tr>
        <td class="kv-lbl">Filing Date / កាលបរិច្ឆេទដាក់ពាក្យ</td>
        <td class="kv-val">${escapeHtml(formattedDate)}</td>
      </tr>
      <tr>
        <td class="kv-lbl">Feedback Type / ប្រភេទពាក្យ</td>
        <td class="kv-val"><strong>${escapeHtml(item.type.toUpperCase())}</strong></td>
      </tr>
      <tr>
        <td class="kv-lbl">Target Category / ប្រភេទអ្នកទទួល</td>
        <td class="kv-val">${escapeHtml(targetCategory)}</td>
      </tr>
      <tr>
        <td class="kv-lbl">Complaint/Suggestion To / ផ្ញើជូនចំពោះ</td>
        <td class="kv-val"><strong>${escapeHtml(item.target_to)}</strong></td>
      </tr>
      <tr>
        <td class="kv-lbl">Submitter / អ្នកដាក់ពាក្យ</td>
        <td class="kv-val">${escapeHtml(submitterText)}</td>
      </tr>
    </table>

    <!-- 2. COMPLAINT & SUGGESTION DETAILS -->
    <div class="section-header">2. COMPLAINT &amp; SUGGESTION DETAILS / ព័ត៌មានលម្អិតនៃបណ្តឹង ឬសំណូមពរ</div>
    <div class="section-divider"></div>
    <table class="kv-table">
      <tr>
        <td class="kv-lbl">Subject / ប្រធានបទ</td>
        <td class="kv-val"><strong>${escapeHtml(item.subject)}</strong></td>
      </tr>
    </table>

    <div class="content-lbl">Description / ខ្លឹមសារលម្អិត:</div>
    <div class="content-box">${escapeHtml(detailText)}</div>

    ${suggestionText ? `
    <div class="content-lbl" style="color: #b45309;">Proposed Suggestion / សំណូមពរ ឬដំណោះស្រាយស្នើឡើង:</div>
    <div class="content-box suggestion">${escapeHtml(suggestionText)}</div>
    ` : ""}

    ${remarkText ? `
    <div class="content-lbl" style="color: #1d4ed8;">HR Review &amp; Remarks / ចំណាំ និងវិធានការដោះស្រាយរបស់ធនធានមនុស្ស:</div>
    <div class="content-box remark">${escapeHtml(remarkText)}</div>
    ` : ""}

    <!-- 3. ATTACHMENT INFO -->
    <div class="section-header">3. ATTACHMENT INFO / ឯកសារភ្ជាប់</div>
    <div class="section-divider"></div>
    <div class="attachment-row">
      <div class="attachment-lbl">Attachment / ឯកសារភ្ជាប់</div>
      <div class="file-bar">
        ${item.attachment_url
          ? `<span>📄 ${escapeHtml(item.attachment_name || "Supporting Document")}</span><span>AWS S3</span>`
          : `<span style="color:#94a3b8;font-style:italic;">No supporting attachments / គ្មានឯកសារភ្ជាប់</span>`}
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-block">
      <div>
        <div class="sig-line">${item.show_identity === false ? "ANONYMOUS" : escapeHtml(item.employees ? `${item.employees.first_name} ${item.employees.last_name}` : (item.recorded_by || "Submitter"))}</div>
        <div class="sig-role">Submitter / អ្នកដាក់ពាក្យ</div>
      </div>
      <div>
        <div class="sig-line">${escapeHtml(buName)} Management</div>
        <div class="sig-role">BU / Department Head / អ្នកគ្រប់គ្រង</div>
      </div>
      <div>
        <div class="sig-line">Human Resources / ធនធានមនុស្ស</div>
        <div class="sig-role">HR Representative / តំណាងផ្នែកធនធានមនុស្ស</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function exportComplaintPdf(item: ComplaintSuggestion, branchName?: string | null): boolean {
  if (!item) return false;
  try {
    const baseHtml = generateComplaintPdfHtml(item, branchName);
    const autoPrintScript = `
      <script>
        async function triggerPrint() {
          try {
            if (document.fonts && document.fonts.ready) { await document.fonts.ready; }
          } catch (e) {}
          setTimeout(() => {
            try { window.focus(); window.print(); } catch (err) { console.error(err); }
          }, 450);
        }
        if (document.readyState === 'complete') { triggerPrint(); }
        else { window.addEventListener('load', triggerPrint); }
      <\/script>
    `;
    const printableHtml = baseHtml.replace("</body>", `${autoPrintScript}</body>`);
    const blob = new Blob([printableHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) { printWindow.focus(); return true; }
  } catch (err) {
    console.warn("Failed to open PDF window:", err);
  }
  return false;
}
