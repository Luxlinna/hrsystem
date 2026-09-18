export const offerLetterHtmlStyles = `
  @page { size: A4 portrait; margin: 0mm; }
  *, *:before, *:after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0; padding: 0; color: #0f172a; background: #ffffff; font-size: 11.5px; line-height: 1.5;
  }
  table.print-page-layout { width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0; }
  table.print-page-layout > thead { display: table-header-group; }
  table.print-page-layout > tfoot { display: table-footer-group; }
  table.print-page-layout > thead > tr > td,
  table.print-page-layout > tfoot > tr > td,
  table.print-page-layout > tbody > tr > td { border: none; padding: 0; margin: 0; }
  .page-header-spacer { height: 8mm; }
  .page-footer-spacer { height: 8mm; }
  .page-container { width: 100%; padding: 0 16mm; box-sizing: border-box; }
  .header-top-row {
    width: 100%; display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; gap: 16px;
  }
  .header-logo-box { flex: 0 0 auto; display: flex; align-items: center; }
  .header-logo-img {
    max-height: 85px; max-width: 300px; width: auto; height: auto; object-fit: contain; object-position: left center; display: block;
  }
  .header-title-box { flex: 1 1 auto; text-align: right; }
  .form-title {
    font-size: 20px; font-weight: 900; color: #253C7D; margin: 0; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.1;
  }
  .header-divider { height: 2.5px; background-color: #253C7D; width: 100%; margin: 6px 0 14px 0; }
  .meta-row {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 11px; color: #475569;
  }
  .ref-badge {
    font-family: monospace; font-size: 11.5px; font-weight: 800; background: #eef2ff; color: #253C7D; border: 1px solid #c7d2fe; padding: 2px 8px; border-radius: 4px;
  }
  .salutation-box {
    background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #253C7D; padding: 7px 12px; border-radius: 4px; margin-bottom: 10px; font-size: 11px; line-height: 1.5;
  }
  .section-title { font-size: 12px; font-weight: 800; color: #253C7D; margin: 10px 0 4px 0; letter-spacing: 0.2px; }
  .info-table { width: 100%; border-collapse: collapse; border: 1.5px solid #253C7D; margin-bottom: 10px; page-break-inside: avoid; }
  .info-table td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 11px; vertical-align: middle; color: #0f172a; }
  .info-table .lbl { font-weight: 700; width: 28%; background-color: #f1f5f9; color: #1e293b; }
  .info-table .val-highlight { font-weight: 800; color: #253C7D; }
  .terms-box {
    border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 12px; background: #ffffff; margin-bottom: 10px; font-size: 10.5px; line-height: 1.5; color: #334155;
  }
  .terms-box p { margin: 0 0 4px 0; }
  .signatures-box { margin-top: 12px; page-break-inside: avoid; }
  .signatures-grid { display: flex; justify-content: space-between; gap: 16px; }
  .sig-card { width: 48%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #fafafa; }
  .sig-title {
    font-size: 11px; font-weight: 800; color: #253C7D; margin-bottom: 26px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;
  }
  .sig-line { border-bottom: 1.5px solid #475569; margin-bottom: 5px; }
  .sig-name { font-size: 10.5px; font-weight: 700; color: #0f172a; }
  .sig-date { font-size: 9.5px; color: #64748b; margin-top: 2px; }
  .footer-bar {
    margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 4px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; page-break-inside: avoid;
  }
`;
