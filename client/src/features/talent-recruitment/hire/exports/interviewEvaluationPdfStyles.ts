export const interviewEvaluationPdfStyles = `
  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }
  * {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
  }
  body {
    font-family: 'Times New Roman', Times, serif, Arial, sans-serif;
    font-size: 11px;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
  }
  .page-container {
    width: 100%;
    max-width: 188mm;
    margin: 0 auto;
  }
  .company-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .company-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .company-info {
    font-size: 8.5px;
    line-height: 1.3;
    color: #111;
  }
  .company-name-kh {
    font-family: 'Kantumruy Pro', sans-serif;
    font-size: 11px;
    font-weight: bold;
  }
  .company-name-en {
    font-weight: bold;
    font-size: 10px;
  }

  /* Master Results Table */
  .results-table {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid #000;
  }
  .results-table th, .results-table td {
    border: 1px solid #000;
    vertical-align: top;
    padding: 5px 8px;
  }
  .table-title {
    text-align: center;
    font-weight: bold;
    font-size: 13.5px;
    letter-spacing: 0.5px;
    padding: 6px !important;
    text-transform: uppercase;
    background-color: #fff;
    border: 1px solid #000;
  }
  .sub-section-header {
    text-align: center;
    font-weight: bold;
    font-size: 12px;
    padding: 4.5px !important;
    background-color: #fff;
    border: 1px solid #000;
  }
  .check-box {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1px solid #000;
    margin-right: 6px;
    vertical-align: middle;
    text-align: center;
    line-height: 11px;
    font-size: 10px;
    font-weight: bold;
  }
  .approval-container {
    height: 155px;
    position: relative;
    padding: 10px 14px !important;
    border: 1px solid #000;
  }
  .approval-box {
    float: right;
    width: 230px;
    text-align: center;
    margin-right: 15px;
  }
  .employer-title {
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 50px;
  }
  .employer-sign-line {
    border-top: 1px solid #000;
    padding-top: 4px;
    font-size: 11px;
    line-height: 1.35;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;
