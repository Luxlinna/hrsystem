export const SINGLE_EMPLOYEE_PDF_STYLES = `
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    margin: 0; padding: 0; color: #1e293b; background: #fff; font-size: 10px; line-height: 1.4;
  }
  .page-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px solid #253C7D; padding-bottom: 8px; margin-bottom: 12px;
  }
  .company-title { font-size: 16px; font-weight: 800; color: #253C7D; letter-spacing: -0.2px; }
  .doc-type { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-right { text-align: right; font-size: 9px; color: #64748b; }
  .hero-card {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 10px 14px; display: flex; gap: 14px; align-items: center; margin-bottom: 12px;
  }
  .avatar-box {
    width: 60px; height: 60px; border-radius: 8px; background: #e2e8f0;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
    font-weight: 800; color: #253C7D; overflow: hidden; border: 1px solid #cbd5e1; flex-shrink: 0;
  }
  .avatar-box img { width: 100%; height: 100%; object-fit: cover; }
  .hero-info { flex: 1; }
  .hero-name { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
  .hero-khname { font-size: 11px; color: #64748b; margin-bottom: 4px; }
  .hero-meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 10px; margin-top: 4px; font-size: 9px; }
  .hero-meta-item strong { color: #475569; display: block; font-size: 8px; text-transform: uppercase; }
  .status-pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; color: #fff; }
  .section-block { margin-bottom: 10px; page-break-inside: avoid; }
  .section-header {
    background: #253C7D; color: #fff; padding: 4px 8px; font-size: 9.5px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    border-radius: 4px 4px 0 0; display: flex; justify-content: space-between;
  }
  .section-body { border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 8px 10px; background: #fff; }
  .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 12px; }
  .data-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 12px; }
  .data-item { font-size: 9.5px; }
  .data-label { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1px; }
  .data-val { font-weight: 600; color: #1e293b; word-break: break-word; }
  .data-val-mono { font-family: monospace; color: #0f172a; font-weight: 600; }
  table.custom-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  table.custom-table th {
    background: #f1f5f9; color: #475569; font-size: 8.5px; font-weight: 700;
    text-transform: uppercase; padding: 4px 6px; border: 1px solid #e2e8f0; text-align: left;
  }
  .signature-box { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 16px; page-break-inside: avoid; padding-top: 8px; border-top: 1px dashed #cbd5e1; }
  .signature-col { text-align: center; }
  .signature-line { border-bottom: 1px solid #475569; margin-top: 32px; margin-bottom: 4px; }
  .signature-label { font-size: 8.5px; color: #64748b; text-transform: uppercase; font-weight: 700; }
  .footer { margin-top: 12px; font-size: 8px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px; }
`;
