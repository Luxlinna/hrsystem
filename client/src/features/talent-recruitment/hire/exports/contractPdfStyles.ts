export const contractPdfStyles = `
  @page {
    size: A4 portrait;
    margin: 0mm !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #f1f5f9;
    color: #1e293b;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 12.5px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .no-print {
    position: sticky;
    top: 0;
    z-index: 9999;
    background: #0f172a;
    color: #fff;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15);
  }
  .contract-page {
    background: #fff;
    max-width: 820px;
    margin: 24px auto;
    padding: 16mm 18mm;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border-radius: 4px;
    box-sizing: border-box;
  }
  .header {
    border-bottom: 2px solid #253C7D;
    padding-bottom: 12px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-logo {
    width: 54px;
    height: 54px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .company-khmer {
    font-family: 'Kantumruy Pro', sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.25;
  }
  .company-title {
    font-size: 15px;
    font-weight: 900;
    color: #253C7D;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  .company-sub {
    font-size: 10px;
    color: #64748b;
    font-weight: 600;
    margin-top: 2px;
  }
  .badge { font-size: 11px; font-weight: 800; background: #EEF2FF; color: #3730A3; border: 1px solid #C7D2FE; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; }
  .doc-title { text-align: center; font-size: 17px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 18px 0 6px; letter-spacing: 0.04em; }
  .doc-ref { text-align: center; font-size: 11px; color: #64748b; font-weight: 700; margin-bottom: 20px; }
  .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: #1e293b; background: #f8fafc; border-left: 3px solid #253C7D; padding: 5px 10px; margin: 16px 0 10px; }
  .table-details { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
  .table-details td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .table-details td.label { width: 28%; font-weight: 700; color: #475569; }
  .table-details td.val { width: 72%; font-weight: 600; color: #0f172a; }
  .sigs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; page-break-inside: avoid; }
  .sig-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; min-height: 64px; display: flex; flex-direction: column; justify-content: space-between; }
  .sig-role { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #64748b; }
  .sig-name { font-size: 11.5px; font-weight: 800; color: #0f172a; }
  .sig-meta { font-size: 9.5px; color: #059669; font-weight: 600; }
  .sig-pending { font-size: 9.5px; color: #94a3b8; font-style: italic; }
  @media print {
    .no-print { display: none !important; }
    html, body { background: #fff !important; }
    .contract-page {
      margin: 0 !important;
      padding: 14mm 16mm !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
    }
  }
`;
