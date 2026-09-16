import type { DisciplinaryRecord } from "../types";
import { formatDateDMY, formatMultilinePreview } from "../utils/formatters";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateWarningLetterHtml(record: DisciplinaryRecord, profile?: any): string {
  const emp = profile || record.employees;
  const empName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Sin Thearith";
  const empCode = profile?.employee_code || profile?.biometric_user_id || record.employees?.employee_id || "3783";
  const avatarUrl = profile?.avatar_url || record.employees?.avatar_url;

  const rawRole = profile?.position || profile?.role || record.employees?.role || "Staff";
  const designation = rawRole.toLowerCase().startsWith("staff") ? rawRole : `Staff, ${rawRole}`;
  const department = profile?.department || profile?.division || record.employees?.department || "PROCESSING CENTER";

  const supervisor =
    profile?.line_manager ||
    (profile?.manager ? `${profile.manager.first_name} ${profile.manager.last_name}` : "Unknown");

  const empType = profile?.employment_type ? profile.employment_type.toUpperCase() : "FULL-TIME";
  const contractType = profile?.contract_type ? profile.contract_type.toUpperCase() : "PERMANENT (UDC)";
  const site = profile?.site || profile?.work_locations?.name || profile?.branches?.name || record.branches?.name || "8887";

  const rawJoinDate = profile?.join_date || profile?.start_date || (record.employees as any)?.join_date || "2025-07-28";
  const joiningDate = formatDateDMY(rawJoinDate);

  const currency = profile?.contract_rate_currency || "USD";
  const frequency = profile?.contract_rate_frequency || "Monthly";

  const warningType = record.warning_type || record.type || "First Written";
  const warningDate = formatDateDMY(record.warning_date || record.incident_date);
  const dateIssued = formatDateDMY(record.warning_date || record.incident_date || record.created_at);

  const violationText = formatMultilinePreview(record.description);
  const actionText = formatMultilinePreview(record.action_to_take || record.action_taken);
  const promiseText = formatMultilinePreview(record.employee_promise);
  const cleanRemark = (record.remark || record.notes || "").replace(/\[VOIDED\]/gi, "").trim();

  const isVoided =
    record.status === "voided" ||
    record.status === "void" ||
    (record.remark && record.remark.includes("[VOIDED]"));

  return `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8">
  <title></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,300..700;1,300..700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,300..700;1,300..700&family=Inter:wght@300;400;500;600;700;800&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      line-height: 1.8;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .top-banner {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: #0284c7;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-close {
      background: #334155;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      margin-left: 8px;
    }
    .page-container {
      max-width: 860px;
      margin: 20px auto;
      background: #ffffff;
      padding: 36px 44px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
      border-radius: 8px;
    }
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .doc-subtitle {
      font-size: 12px;
      color: #0284c7;
      font-weight: 700;
      margin-top: 2px;
    }
    .doc-ref {
      text-align: right;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .section-header {
      font-size: 12px;
      font-weight: 800;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
      margin-top: 20px;
    }
    .section-divider {
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 14px;
    }
    .emp-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
      background: #ffffff;
      margin-bottom: 8px;
    }
    .avatar-box {
      width: 68px;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }
    .avatar-img {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #cbd5e1;
    }
    .badge-employed {
      margin-top: 6px;
      background: #14b8a6;
      color: white;
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .emp-info-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px 20px;
      font-size: 11.5px;
    }
    .info-val {
      font-weight: 600;
      color: #0f172a;
      line-height: 1.4;
    }
    .info-lbl {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 1px;
    }
    .rate-pill {
      background: #3b82f6;
      color: white;
      font-size: 8.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 4px;
    }
    .gross-pill {
      background: #60a5fa;
      color: white;
      font-size: 8.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 3px;
    }
    .kv-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    .kv-table td {
      padding: 7px 0;
      vertical-align: top;
    }
    .kv-lbl {
      width: 260px;
      color: #475569;
      font-weight: 500;
      padding-right: 14px;
    }
    .kv-val {
      color: #0f172a;
      line-height: 1.85;
      font-weight: 500;
    }
    .attachment-row {
      display: flex;
      gap: 20px;
      font-size: 11.5px;
      padding: 6px 0;
    }
    .attachment-lbl {
      width: 246px;
      color: #475569;
      font-weight: 500;
      flex-shrink: 0;
    }
    .file-bar {
      flex: 1;
      border-bottom: 2px solid #22c55e;
      padding-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #1e293b;
      font-weight: 600;
      font-size: 11px;
    }
    .signatures-block {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-line {
      margin-top: 48px;
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
    }
    .sig-role {
      font-size: 10px;
      color: #64748b;
      margin-top: 1px;
    }

    @page {
      size: A4 portrait;
      margin: 0 !important;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
      .page-container {
        margin: 0 !important;
        padding: 14mm 16mm !important;
        box-shadow: none !important;
        max-width: 100% !important;
        width: 100% !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="top-banner no-print">
    <div>
      <strong>Employee Warning Record</strong> &bull; ${escapeHtml(empName)} (${escapeHtml(empCode)})
    </div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="page-container">
    <!-- Header -->
    <div class="doc-header">
      <div>
        <div class="doc-title">${escapeHtml(site)}</div>
        <div class="doc-subtitle">EMPLOYEE WARNING RECORD / លិខិតកត់ត្រាការព្រមានបុគ្គលិក</div>
      </div>
      <div class="doc-ref">
        <div><strong>Doc Ref / លេខយោង:</strong> WRN-${escapeHtml(record.id.slice(0, 8).toUpperCase())}</div>
        <div><strong>Date / កាលបរិច្ឆេទ:</strong> ${escapeHtml(dateIssued)}</div>
        <div><strong>Status / ស្ថានភាព:</strong> ${isVoided ? '<span style="color: #64748b; font-weight: 800;">VOIDED</span>' : '<span style="color: #0d9488; font-weight: 800;">RECORDED</span>'}</div>
      </div>
    </div>

    <!-- 1. EMPLOYEE INFO -->
    <div class="section-header">EMPLOYEE INFO / ព័ត៌មានបុគ្គលិក</div>
    <div class="section-divider"></div>

    <div class="emp-card">
      <div class="avatar-box">
        ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" alt="" class="avatar-img" />` : `<div class="avatar-img" style="background:#253C7D;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;">${escapeHtml(emp ? emp.first_name[0] + emp.last_name[0] : "ST")}</div>`}
        <span class="badge-employed">Employed</span>
      </div>

      <div style="flex:1;">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:12px;">${escapeHtml(empName)}</div>

        <div class="emp-info-grid">
          <!-- Col 1 -->
          <div>
            <div class="info-val">${escapeHtml(empCode)}</div>
            <div class="info-lbl">Employee Code / លេខកូដបុគ្គលិក</div>
            <div style="height:10px;"></div>
            <div class="info-val">${escapeHtml(designation)}</div>
            <div class="info-lbl">Designation / មុខតំណែង</div>
            <div style="height:10px;"></div>
            <div class="info-val" style="text-transform:uppercase;">${escapeHtml(department)}</div>
            <div class="info-lbl">Department / នាយកដ្ឋាន</div>
          </div>

          <!-- Col 2 -->
          <div>
            <div class="info-val">${escapeHtml(supervisor)}</div>
            <div class="info-lbl">Supervisor / អ្នកគ្រប់គ្រង</div>
            <div style="height:10px;"></div>
            <div class="info-val">${escapeHtml(empType)}</div>
            <div class="info-lbl">Employee Type / ប្រភេទបុគ្គលិក</div>
            <div style="height:10px;"></div>
            <div class="info-val">${escapeHtml(contractType)}</div>
            <div class="info-lbl">Contract Type / ប្រភេទកិច្ចសន្យា</div>
          </div>

          <!-- Col 3 -->
          <div>
            <div class="info-val">${escapeHtml(site)}</div>
            <div class="info-lbl">Site / ទីតាំងការងារ</div>
            <div style="height:10px;"></div>
            <div class="info-val">
              ${escapeHtml(currency)} *****
              <span class="rate-pill">${escapeHtml(frequency)}</span>
              <span class="gross-pill">Gross</span>
            </div>
            <div class="info-lbl">Rate / ប្រាក់បៀវត្ស</div>
            <div style="height:10px;"></div>
            <div class="info-val">${escapeHtml(joiningDate)}</div>
            <div class="info-lbl">Joining Date / ថ្ងៃចូលបម្រើការងារ</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. WARNING INFO -->
    <div class="section-header">WARNING INFO / ព័ត៌មានការព្រមាន</div>
    <div class="section-divider"></div>

    <table class="kv-table">
      <tr>
        <td class="kv-lbl">Warning Type / ប្រភេទការព្រមាន</td>
        <td class="kv-val">${escapeHtml(warningType)}</td>
      </tr>
      <tr>
        <td class="kv-lbl">Alert Day After Warning(day) / ថ្ងៃជូនដំណឹង</td>
        <td class="kv-val">7</td>
      </tr>
      <tr>
        <td class="kv-lbl">Stop Alert After Alert Day(day) / ថ្ងៃបញ្ឈប់ដំណឹង</td>
        <td class="kv-val">3</td>
      </tr>
      <tr>
        <td class="kv-lbl">Warning Date / កាលបរិច្ឆេទព្រមាន</td>
        <td class="kv-val">${escapeHtml(warningDate)}</td>
      </tr>
      <tr>
        <td class="kv-lbl">Description of Violation / ការពិពណ៌នាកំហុសឆ្គង</td>
        <td class="kv-val" style="white-space:pre-line;">${escapeHtml(violationText)}</td>
      </tr>
      <tr>
        <td class="kv-lbl">Action to Be Taken / វិធានការត្រូវអនុវត្ត</td>
        <td class="kv-val" style="white-space:pre-line;">${escapeHtml(actionText)}</td>
      </tr>
      <tr>
        <td class="kv-lbl">Employee Promise / ការសន្យារបស់បុគ្គលិក</td>
        <td class="kv-val" style="white-space:pre-line;">${escapeHtml(promiseText)}</td>
      </tr>
      <tr>
        <td class="kv-lbl">Remark / សម្គាល់ផ្សេងៗ</td>
        <td class="kv-val" style="white-space:pre-line;">${escapeHtml(cleanRemark || "—")}</td>
      </tr>
    </table>

    <!-- 3. ATTACHMENT INFO -->
    <div class="section-header">ATTACHMENT INFO / ឯកសារភ្ជាប់</div>
    <div class="section-divider"></div>

    <div class="attachment-row">
      <div class="attachment-lbl">Attachment / ឯកសារភ្ជាប់</div>
      <div class="file-bar">
        <span>📄 ${escapeHtml(record.document_name || (record.document_url ? "photo_2026-09-12_11-24-47.jpg" : "No attachment uploaded"))}</span>
        ${record.document_url ? '<span>184 KB</span>' : ""}
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-block">
      <div>
        <div class="sig-line">${escapeHtml(empName)}</div>
        <div class="sig-role">Employee Signature / ហត្ថលេខាបុគ្គលិក</div>
      </div>
      <div>
        <div class="sig-line">${escapeHtml(supervisor !== "Unknown" ? supervisor : (record.created_by || "Issuing Manager"))}</div>
        <div class="sig-role">Issuing Supervisor / ហត្ថលេខាអ្នកគ្រប់គ្រង</div>
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

export function exportWarningLetterPdf(record: DisciplinaryRecord, profile?: any): boolean {
  if (!record) return false;
  try {
    const baseHtml = generateWarningLetterHtml(record, profile);
    const autoPrintScript = `
      <script>
        async function triggerPrint() {
          try {
            if (document.fonts && document.fonts.ready) {
              await document.fonts.ready;
            }
          } catch (e) {}
          setTimeout(() => {
            try {
              window.focus();
              window.print();
            } catch (err) {
              console.error(err);
            }
          }, 450);
        }
        if (document.readyState === 'complete') {
          triggerPrint();
        } else {
          window.addEventListener('load', triggerPrint);
        }
      </script>
    `;
    const printableHtml = baseHtml.replace("</body>", `${autoPrintScript}</body>`);
    const blob = new Blob([printableHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      return true;
    }
  } catch (err) {
    console.warn("Failed to open PDF window:", err);
  }
  return false;
}
