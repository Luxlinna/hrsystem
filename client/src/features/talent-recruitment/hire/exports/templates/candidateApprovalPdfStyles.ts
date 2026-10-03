export const candidateApprovalPdfStyles = `
  @page {
    size: A4 portrait;
    margin: 8mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Inter', 'Kantumruy Pro', sans-serif;
    color: #111;
    margin: 0;
    padding: 0;
    background: #fff;
    font-size: 10.5px;
    line-height: 1.3;
  }
  .caf-page {
    width: 100%;
    max-width: 194mm;
    margin: 0 auto;
  }
  .caf-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
  }
  .caf-table td, .caf-table th {
    border: 1px solid #111;
    padding: 3.5px 6px;
  }
  .label-cell {
    font-weight: bold;
    background-color: #fafafa;
    width: 22%;
    font-size: 10px;
  }
  .value-cell {
    width: 28%;
    font-size: 10px;
  }
  .sec-header {
    font-size: 11px;
    font-weight: bold;
    margin-top: 5px;
    margin-bottom: 3px;
    text-decoration: underline;
  }
`;
