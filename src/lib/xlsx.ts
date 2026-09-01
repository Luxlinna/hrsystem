/**
 * Native Zero-Dependency XLSX Generator & Shim
 * Replaces vulnerable sheetjs / xlsx package with 100% secure, in-browser OpenXML generator.
 */

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colToLetter(colIndex: number): string {
  let temp = colIndex + 1;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

// CRC32 table
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
}

function createZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileRecords: {
    entry: ZipEntry;
    offset: number;
    crc: number;
    nameBuf: Uint8Array;
  }[] = [];

  let totalLocalSize = 0;
  for (const entry of entries) {
    const nameBuf = encoder.encode(entry.path);
    const crc = crc32(entry.data);
    fileRecords.push({
      entry,
      offset: totalLocalSize,
      crc,
      nameBuf,
    });
    // 30 bytes local header + name length + data length
    totalLocalSize += 30 + nameBuf.length + entry.data.length;
  }

  let totalCdSize = 0;
  for (const rec of fileRecords) {
    // 46 bytes central directory header + name length
    totalCdSize += 46 + rec.nameBuf.length;
  }

  const endCdSize = 22;
  const out = new Uint8Array(totalLocalSize + totalCdSize + endCdSize);
  const view = new DataView(out.buffer);

  // Write local file headers and data
  let pos = 0;
  for (const rec of fileRecords) {
    view.setUint32(pos, 0x04034b50, true); // Local file header signature
    view.setUint16(pos + 4, 20, true); // Version needed (2.0)
    view.setUint16(pos + 6, 0, true); // General purpose bit flag
    view.setUint16(pos + 8, 0, true); // Compression method (0 = store)
    view.setUint16(pos + 10, 0, true); // File last mod time
    view.setUint16(pos + 12, 0, true); // File last mod date
    view.setUint32(pos + 14, rec.crc, true); // CRC-32
    view.setUint32(pos + 18, rec.entry.data.length, true); // Compressed size
    view.setUint32(pos + 22, rec.entry.data.length, true); // Uncompressed size
    view.setUint16(pos + 26, rec.nameBuf.length, true); // File name length
    view.setUint16(pos + 28, 0, true); // Extra field length
    pos += 30;

    out.set(rec.nameBuf, pos);
    pos += rec.nameBuf.length;

    out.set(rec.entry.data, pos);
    pos += rec.entry.data.length;
  }

  const cdOffset = pos;

  // Write central directory headers
  for (const rec of fileRecords) {
    view.setUint32(pos, 0x02014b50, true); // Central directory header signature
    view.setUint16(pos + 4, 20, true); // Version made by
    view.setUint16(pos + 6, 20, true); // Version needed
    view.setUint16(pos + 8, 0, true); // General purpose bit flag
    view.setUint16(pos + 10, 0, true); // Compression method (0 = store)
    view.setUint16(pos + 12, 0, true); // File last mod time
    view.setUint16(pos + 14, 0, true); // File last mod date
    view.setUint32(pos + 16, rec.crc, true); // CRC-32
    view.setUint32(pos + 20, rec.entry.data.length, true); // Compressed size
    view.setUint32(pos + 24, rec.entry.data.length, true); // Uncompressed size
    view.setUint16(pos + 28, rec.nameBuf.length, true); // File name length
    view.setUint16(pos + 30, 0, true); // Extra field length
    view.setUint16(pos + 32, 0, true); // File comment length
    view.setUint16(pos + 34, 0, true); // Disk number start
    view.setUint16(pos + 36, 0, true); // Internal file attributes
    view.setUint32(pos + 38, 0, true); // External file attributes
    view.setUint32(pos + 42, rec.offset, true); // Relative offset of local header
    pos += 46;

    out.set(rec.nameBuf, pos);
    pos += rec.nameBuf.length;
  }

  // End of central directory record
  view.setUint32(pos, 0x06054b50, true); // EOCD signature
  view.setUint16(pos + 4, 0, true); // Number of this disk
  view.setUint16(pos + 6, 0, true); // Disk where CD starts
  view.setUint16(pos + 8, fileRecords.length, true); // Number of CD records on this disk
  view.setUint16(pos + 10, fileRecords.length, true); // Total number of CD records
  view.setUint32(pos + 12, totalCdSize, true); // Size of central directory
  view.setUint32(pos + 16, cdOffset, true); // Offset of CD start
  view.setUint16(pos + 20, 0, true); // Comment length

  return out;
}

export interface WorkSheet {
  name?: string;
  data: any[][];
  cols?: { wch?: number }[];
  "!cols"?: { wch?: number }[];
  [key: string]: any;
}

export interface WorkBook {
  SheetNames: string[];
  Sheets: Record<string, WorkSheet>;
}

function buildSheetXml(ws: WorkSheet): string {
  const rows = ws.data || [];
  let maxCols = 0;
  for (const r of rows) {
    if (r && r.length > maxCols) maxCols = r.length;
  }

  const cols = ws["!cols"] || ws.cols || [];
  let colsXml = "";
  if (cols.length > 0) {
    colsXml = "<cols>" + cols.map((c, i) => {
      const width = c?.wch ? Math.max(c.wch, 8) : 12;
      return `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`;
    }).join("") + "</cols>";
  } else if (maxCols > 0) {
    colsXml = "<cols>" + Array.from({ length: maxCols }, (_, i) =>
      `<col min="${i + 1}" max="${i + 1}" width="15" customWidth="1"/>`
    ).join("") + "</cols>";
  }

  let sheetDataXml = "<sheetData>";
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    const rowIndex = r + 1;
    const isHeader = rowIndex === 1;
    let rowXml = `<row r="${rowIndex}">`;

    for (let c = 0; c < row.length; c++) {
      const cellVal = row[c];
      const cellRef = `${colToLetter(c)}${rowIndex}`;
      const styleAttr = isHeader ? ' s="1"' : "";

      if (cellVal === null || cellVal === undefined || cellVal === "") {
        rowXml += `<c r="${cellRef}"${styleAttr}/>`;
      } else if (typeof cellVal === "number" && !isNaN(cellVal)) {
        rowXml += `<c r="${cellRef}"${styleAttr} t="n"><v>${cellVal}</v></c>`;
      } else if (typeof cellVal === "boolean") {
        rowXml += `<c r="${cellRef}"${styleAttr} t="b"><v>${cellVal ? 1 : 0}</v></c>`;
      } else {
        const text = escapeXml(String(cellVal));
        rowXml += `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t>${text}</t></is></c>`;
      }
    }
    rowXml += "</row>";
    sheetDataXml += rowXml;
  }
  sheetDataXml += "</sheetData>";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  ${colsXml}
  ${sheetDataXml}
</worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="10"/><name val="Segoe UI"/></font>
    <font><b/><sz val="10"/><color rgb="FF1E293B"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left/><right/><top/><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;

export function generateXlsxBuffer(wb: WorkBook): Uint8Array {
  const encoder = new TextEncoder();
  const entries: ZipEntry[] = [];
  const sheetNames = wb.SheetNames.length > 0 ? wb.SheetNames : ["Sheet1"];

  // 1. [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`;

  for (let i = 0; i < sheetNames.length; i++) {
    contentTypesXml += `\n  <Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }
  contentTypesXml += "\n</Types>";
  entries.push({ path: "[Content_Types].xml", data: encoder.encode(contentTypesXml) });

  // 2. _rels/.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  entries.push({ path: "_rels/.rels", data: encoder.encode(relsXml) });

  // 3. xl/workbook.xml
  let sheetsXml = "<sheets>";
  for (let i = 0; i < sheetNames.length; i++) {
    const sName = escapeXml(sheetNames[i].replace(/[\[\]:*?/\\]/g, "").slice(0, 31) || `Sheet${i + 1}`);
    sheetsXml += `<sheet name="${sName}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`;
  }
  sheetsXml += "</sheets>";

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  ${sheetsXml}
</workbook>`;
  entries.push({ path: "xl/workbook.xml", data: encoder.encode(workbookXml) });

  // 4. xl/_rels/workbook.xml.rels
  let wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;
  for (let i = 0; i < sheetNames.length; i++) {
    wbRelsXml += `\n  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`;
  }
  wbRelsXml += `\n  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  entries.push({ path: "xl/_rels/workbook.xml.rels", data: encoder.encode(wbRelsXml) });

  // 5. xl/styles.xml
  entries.push({ path: "xl/styles.xml", data: encoder.encode(STYLES_XML) });

  // 6. xl/worksheets/sheetN.xml
  for (let i = 0; i < sheetNames.length; i++) {
    const sName = sheetNames[i];
    const ws = wb.Sheets[sName] || { data: [] };
    const sheetXml = buildSheetXml(ws);
    entries.push({ path: `xl/worksheets/sheet${i + 1}.xml`, data: encoder.encode(sheetXml) });
  }

  return createZip(entries);
}

export function downloadXlsx(wb: WorkBook, filename = "export.xlsx"): void {
  const bytes = generateXlsxBuffer(wb);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const utils = {
  book_new: (): WorkBook => ({
    SheetNames: [],
    Sheets: {},
  }),

  aoa_to_sheet: (aoa: any[][]): WorkSheet => ({
    data: aoa || [],
    cols: aoa && aoa.length > 0 ? aoa[0].map((c) => ({ wch: Math.max(String(c ?? "").length + 3, 12) })) : [],
  }),

  json_to_sheet: (jsonData: Record<string, any>[]): WorkSheet => {
    if (!jsonData || jsonData.length === 0) return { data: [] };
    const headers = Object.keys(jsonData[0]);
    const rows = jsonData.map((row) => headers.map((k) => row[k] ?? ""));
    return {
      data: [headers, ...rows],
      cols: headers.map((h) => ({ wch: Math.max(h.length + 3, 14) })),
      "!cols": headers.map((h) => ({ wch: Math.max(h.length + 3, 14) })),
    };
  },

  book_append_sheet: (wb: WorkBook, ws: WorkSheet, name = "Sheet1"): void => {
    const cleanName = name.replace(/[\[\]:*?/\\]/g, "").slice(0, 31) || `Sheet${wb.SheetNames.length + 1}`;
    ws.name = cleanName;
    if (!wb.SheetNames.includes(cleanName)) {
      wb.SheetNames.push(cleanName);
    }
    wb.Sheets[cleanName] = ws;
  },
};

export const writeFile = downloadXlsx;
export const write = (wb: WorkBook) => generateXlsxBuffer(wb);

export default {
  utils,
  writeFile,
  write,
  generateXlsxBuffer,
  downloadXlsx,
};
