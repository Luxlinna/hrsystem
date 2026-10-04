export const SINGLE_EMPLOYEE_PDF_STYLES = `
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    margin: 0; padding: 0; color: #0f172a; background: #fff; font-size: 9.5px; line-height: 1.4;
  }
  .page-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px;
  }
  .company-title { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px; text-transform: uppercase; }
  .doc-type { font-size: 9px; color: #475569; font-weight: 600; }
  .meta-right { text-align: right; font-size: 8.5px; color: #475569; }
  .hero-card {
    border: 1px solid #e2e8f0; border-radius: 4px;
    padding: 10px 12px; display: flex; gap: 14px; align-items: center; margin-bottom: 12px; background: #fafbfc;
  }
  .avatar-box {
    width: 56px; height: 56px; border-radius: 4px; background: #f1f5f9;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
    font-weight: 700; color: #0f172a; overflow: hidden; border: 1px solid #cbd5e1; flex-shrink: 0;
  }
  .avatar-box img { width: 100%; height: 100%; object-fit: cover; }
  .hero-info { flex: 1; }
  .hero-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .hero-khname { font-size: 10px; color: #64748b; margin-bottom: 3px; }
  .hero-meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 8px; margin-top: 4px; font-size: 8.5px; }
  .hero-meta-item strong { color: #475569; display: block; font-size: 7.5px; text-transform: uppercase; }
  .status-pill { display: inline-block; font-size: 8.5px; font-weight: 700; letter-spacing: 0.3px; }
  .section-block { margin-bottom: 10px; page-break-inside: avoid; }
  .section-header {
    border-bottom: 1.5px solid #0f172a; padding: 2px 0 3px 0; margin-bottom: 6px;
    font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
    color: #0f172a; display: flex; justify-content: space-between;
  }
  .section-body { padding: 2px 0; }
  .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 12px; }
  .data-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 12px; }
  .data-item { font-size: 9px; }
  .data-label { font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 1px; }
  .data-val { font-weight: 500; color: #0f172a; word-break: break-word; }
  .data-val-mono { font-family: monospace; color: #0f172a; font-weight: 600; }
  table.custom-table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 8px; }
  table.custom-table th {
    background: #f1f5f9; color: #0f172a; font-size: 7.5px; font-weight: 700;
    text-transform: uppercase; padding: 3px 5px; border: 1px solid #cbd5e1; text-align: left;
  }
  .signature-box { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 18px; page-break-inside: avoid; padding-top: 8px; border-top: 1px dashed #cbd5e1; }
  .signature-col { text-align: center; }
  .signature-line { border-bottom: 1px solid #64748b; margin-top: 32px; margin-bottom: 4px; }
  .signature-label { font-size: 8px; color: #475569; text-transform: uppercase; font-weight: 600; }
  .footer { margin-top: 12px; font-size: 7.5px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px; }
`;
