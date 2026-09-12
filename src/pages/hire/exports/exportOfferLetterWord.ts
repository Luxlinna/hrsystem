import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
  ImageRun,
} from "docx";
import type { OfferLetter } from "../types";
import { resolveDocumentBranding } from "@/services/formLogoService";

function getLogoBuffer(logoBase64: string): Uint8Array | null {
  try {
    const base64Clean = logoBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = atob(base64Clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function formatCurrency(val?: number | null): string {
  if (val === null || val === undefined) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

export async function exportOfferLetterWord(
  offer: OfferLetter,
  buLogoCustom?: string,
  isHrDivisionContext?: boolean
): Promise<boolean> {
  // A4 Page Setup: Width = 11,906 dxa, Margins = 953 dxa (~16.8mm each side).
  // Total Content Width = 10,000 dxa.
  const TOTAL_WIDTH = 10000;
  const HALF_WIDTH = 5000;
  const COL_LABEL_WIDTH = 2800;
  const COL_VAL_WIDTH = 2200;
  const COL_SPAN3_WIDTH = 7200;

  // Exact Brand Colors from PDF
  const NAVY_COLOR = "253C7D";       // #253C7D - Primary Brand Navy
  const TEXT_DARK = "0F172A";        // #0F172A - Deep charcoal body text
  const TEXT_MUTED = "475569";       // #475569 - Secondary text
  const TEXT_LIGHT_MUTED = "64748B"; // #64748B
  const BORDER_COLOR = "CBD5E1";     // #CBD5E1 - Cell grid border
  const BG_LABEL = "F1F5F9";         // #F1F5F9 - Label background
  const BG_HIGHLIGHT = "EEF2FF";     // #EEF2FF - Total package highlight
  const FONT_FAMILY = "Calibri";

  const outerNavyBorder = {
    style: BorderStyle.SINGLE,
    size: 12, // 1.5 pt solid navy
    color: NAVY_COLOR,
  };

  const innerGridBorder = {
    style: BorderStyle.SINGLE,
    size: 4, // 0.5 pt solid slate
    color: BORDER_COLOR,
  };

  const infoTableBorders = {
    top: outerNavyBorder,
    bottom: outerNavyBorder,
    left: outerNavyBorder,
    right: outerNavyBorder,
    insideHorizontal: innerGridBorder,
    insideVertical: innerGridBorder,
  };

  const thinCardBorders = {
    top: innerGridBorder,
    bottom: innerGridBorder,
    left: innerGridBorder,
    right: innerGridBorder,
  };

  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: "auto",
  };

  const noBorders = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
    insideHorizontal: noBorder,
    insideVertical: noBorder,
  };

  const cellMargins = {
    top: 80,
    bottom: 80,
    left: 110,
    right: 110,
  };

  // Logo resolves dynamically: When export is at HR Division -> UNI Logo (no OPS). Otherwise BU Logo (OPS).
  const { logo: resolvedLogo, companyName: defaultBuName, companyKhmer, isHrDivision } = resolveDocumentBranding({
    businessUnit: offer.business_unit,
    department: offer.department,
    division: offer.division,
    customLogo: buLogoCustom,
    isHrDivisionContext,
  });

  const buName = isHrDivision ? defaultBuName : (offer.business_unit || defaultBuName);

  const formattedOfferDate = offer.issued_at
    ? new Date(offer.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const formattedStartDate = offer.target_start_date
    ? new Date(offer.target_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "To be confirmed";

  const formattedExpiryDate = offer.expiry_date
    ? new Date(offer.expiry_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "7 days from issuance";

  const totalAllowances = (offer.allowances || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalPackage = Number(offer.base_salary || 0) + totalAllowances;
  const isBasedOnQual =
    (offer.special_terms || "").toLowerCase().includes("qualification") ||
    (offer.proposal_notes || "").toLowerCase().includes("qualification");

  const logoBytes = getLogoBuffer(resolvedLogo);

  // 1. Header Top Row (Logo on Left, "OFFICIAL OFFER OF EMPLOYMENT" on Right - Exact PDF Layout)
  const headerTopTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Left: Clean Logo box
          new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: logoBytes
                  ? [
                      new ImageRun({
                        data: logoBytes,
                        transformation: { width: 68, height: 68 },
                        type: "png",
                      }),
                    ]
                  : [
                      new TextRun({
                        text: buName,
                        bold: true,
                        size: 24,
                        color: NAVY_COLOR,
                        font: FONT_FAMILY,
                      }),
                    ],
              }),
            ],
          }),
          // Right: Official Offer Title
          new TableCell({
            width: { size: 5500, type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: "OFFICIAL OFFER OF EMPLOYMENT",
                    bold: true,
                    size: 26, // 13pt
                    color: NAVY_COLOR,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 2. Header Divider Bar (2.5px Navy Bar)
  const headerDividerTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 20, color: NAVY_COLOR },
              bottom: noBorder,
              left: noBorder,
              right: noBorder,
            },
            children: [new Paragraph({ spacing: { before: 0, after: 60 }, children: [] })],
          }),
        ],
      }),
    ],
  });

  // 3. Meta Row (Date on Left, Offer Ref Badge on Right)
  const metaTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Date
          new TableCell({
            width: { size: HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [
                  new TextRun({ text: "Date: ", bold: true, size: 20, color: TEXT_MUTED, font: FONT_FAMILY }),
                  new TextRun({ text: formattedOfferDate, size: 20, color: TEXT_DARK, font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
          // Offer Ref Badge
          new TableCell({
            width: { size: HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 80 },
                children: [
                  new TextRun({ text: "Offer Ref: ", bold: true, size: 20, color: TEXT_MUTED, font: FONT_FAMILY }),
                  new TextRun({
                    text: ` ${offer.offer_number || "OFF-2026"} `,
                    bold: true,
                    size: 20,
                    color: NAVY_COLOR,
                    font: "Consolas",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 4. Salutation Box (F8FAFC background, 4px solid Navy left border)
  const salutationTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 28, color: NAVY_COLOR },
      top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            shading: { fill: "F8FAFC" },
            margins: { top: 90, bottom: 90, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 30 },
                children: [
                  new TextRun({ text: "To: ", bold: true, size: 21, color: TEXT_DARK, font: FONT_FAMILY }),
                  new TextRun({ text: offer.candidate_name, bold: true, size: 21, color: TEXT_DARK, font: FONT_FAMILY }),
                ],
              }),
              ...(offer.candidate_email
                ? [
                    new Paragraph({
                      spacing: { before: 0, after: 40 },
                      children: [
                        new TextRun({ text: `Email: ${offer.candidate_email}`, size: 18, color: TEXT_MUTED, font: FONT_FAMILY }),
                        new TextRun({ text: `  ·  Phone: ${offer.candidate_phone || "—"}`, size: 18, color: TEXT_MUTED, font: FONT_FAMILY }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                spacing: { before: 30, after: 0 },
                children: [
                  new TextRun({ text: "On behalf of ", size: 19, font: FONT_FAMILY }),
                  new TextRun({ text: buName, bold: true, size: 19, font: FONT_FAMILY }),
                  new TextRun({ text: ", we are delighted to formally offer you the position of ", size: 19, font: FONT_FAMILY }),
                  new TextRun({ text: offer.job_title, bold: true, color: NAVY_COLOR, size: 19, font: FONT_FAMILY }),
                  new TextRun({
                    text: ". We were thoroughly impressed with your professional background, qualifications, and interview assessments, and we believe you will make a valuable contribution to our team.",
                    size: 19,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Section Heading Builder
  const createSectionHeading = (title: string) =>
    new Paragraph({
      spacing: { before: 140, after: 50 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 22, // 11pt
          color: NAVY_COLOR,
          font: FONT_FAMILY,
        }),
      ],
    });

  // 5. Section I: Position Details Table
  const positionTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: infoTableBorders,
    rows: [
      // Row 1: Position Title | Business Unit
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Position Title:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: offer.job_title, bold: true, size: 19, color: NAVY_COLOR, font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Business Unit:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: buName, size: 19, color: TEXT_DARK, font: FONT_FAMILY })] })],
          }),
        ],
      }),
      // Row 2: Department | Reports To
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Department / Division:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${offer.department || "—"}${offer.division ? ` / ${offer.division}` : ""}`,
                    size: 19,
                    color: TEXT_DARK,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Reports Directly To:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [
              new Paragraph({
                children: [new TextRun({ text: offer.reporting_to || "Department Manager", bold: true, size: 19, color: TEXT_DARK, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
      // Row 3: Employment Type | Commencement Date
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Employment Type:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: offer.employment_type || "Full Time", size: 19, color: TEXT_DARK, font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Commencement Date:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [
              new Paragraph({
                children: [new TextRun({ text: formattedStartDate, bold: true, color: "059669", size: 19, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
      // Row 4: Working Schedule | Working Hours
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Working Schedule:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: offer.working_days || "Monday to Saturday Half", size: 19, color: TEXT_DARK, font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Working Hours:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: offer.working_time || "8:00 am – 5:00 pm", size: 19, color: TEXT_DARK, font: FONT_FAMILY })] })],
          }),
        ],
      }),
    ],
  });

  // 6. Section II: Remuneration & Compensation Package Table
  const baseSalaryDisplay = isBasedOnQual
    ? offer.base_salary > 0
      ? `${formatCurrency(offer.base_salary)} (Based on Qualification)`
      : "Based on Qualification"
    : formatCurrency(offer.base_salary);

  const remunerationRows = [
    // Row 1: Base Salary | Probation Period
    new TableRow({
      children: [
        new TableCell({
          width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
          shading: { fill: BG_LABEL },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "Gross Base Monthly Salary:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
        }),
        new TableCell({
          width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: baseSalaryDisplay, bold: true, color: "0284C7", size: 21, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
          shading: { fill: BG_LABEL },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "Probation Period:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
        }),
        new TableCell({
          width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${offer.probation_months} Months ${offer.probation_salary ? `(${formatCurrency(offer.probation_salary)} during probation)` : ""}`,
                  bold: true,
                  size: 19,
                  color: TEXT_DARK,
                  font: FONT_FAMILY,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  // Optional Row: Monthly Allowances (if any)
  if (offer.allowances && offer.allowances.length > 0) {
    const allowanceParts: TextRun[] = [];
    offer.allowances.forEach((a, i) => {
      allowanceParts.push(
        new TextRun({ text: `${a.name}: `, bold: true, size: 18, font: FONT_FAMILY }),
        new TextRun({ text: `${formatCurrency(a.amount)}${i < offer.allowances.length - 1 ? "   ·   " : ""}`, size: 18, font: FONT_FAMILY })
      );
    });
    allowanceParts.push(
      new TextRun({ text: `   Total Allowances: ${formatCurrency(totalAllowances)}`, bold: true, color: NAVY_COLOR, size: 18, font: FONT_FAMILY })
    );

    remunerationRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Monthly Allowances:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_SPAN3_WIDTH, type: WidthType.DXA },
            columnSpan: 3,
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: allowanceParts })],
          }),
        ],
      })
    );
  }

  // Row: Total Monthly Package (Highlighted EEF2FF)
  remunerationRows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
          shading: { fill: BG_HIGHLIGHT },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "Total Monthly Package:", bold: true, size: 20, color: NAVY_COLOR, font: FONT_FAMILY })] })],
        }),
        new TableCell({
          width: { size: COL_SPAN3_WIDTH, type: WidthType.DXA },
          columnSpan: 3,
          shading: { fill: BG_HIGHLIGHT },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${formatCurrency(totalPackage)} / month`,
                  bold: true,
                  size: 23,
                  color: NAVY_COLOR,
                  font: FONT_FAMILY,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    // Row: Standard Benefits
    new TableRow({
      children: [
        new TableCell({
          width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
          shading: { fill: BG_LABEL },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "Standard Benefits:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
        }),
        new TableCell({
          width: { size: COL_SPAN3_WIDTH, type: WidthType.DXA },
          columnSpan: 3,
          margins: cellMargins,
          borders: innerGridBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    offer.benefits_summary ||
                    "Health & accident insurance coverage, 18 days annual paid leave, paid public holidays in accordance with Cambodia Labor Law, and annual performance evaluation.",
                  size: 18,
                  color: "334155",
                  font: FONT_FAMILY,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const remunerationTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: infoTableBorders,
    rows: remunerationRows,
  });

  // 7. Section III: General Terms & Conditions (Clean Box Table with 4 numbered terms)
  const termsTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: thinCardBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            margins: { top: 90, bottom: 90, left: 130, right: 130 },
            borders: thinCardBorders,
            children: [
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({ text: "1. Probationary Period: ", bold: true, size: 18, font: FONT_FAMILY }),
                  new TextRun({
                    text: `Your employment is subject to a satisfactory probationary period of ${offer.probation_months} months. Prior to the end of this period, a performance appraisal will be conducted to confirm your ongoing employment status.`,
                    size: 18,
                    color: "334155",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({ text: "2. Compliance & Confidentiality: ", bold: true, size: 18, font: FONT_FAMILY }),
                  new TextRun({
                    text: "You will be required to adhere to all company policies, employee code of conduct, and maintain strict confidentiality regarding all proprietary information, client data, and business operations.",
                    size: 18,
                    color: "334155",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({ text: "3. Pre-Employment Requirements: ", bold: true, size: 18, font: FONT_FAMILY }),
                  new TextRun({
                    text: "This offer is conditional upon satisfactory submission of your national identification, verified educational credentials, and relevant reference checks prior to your start date.",
                    size: 18,
                    color: "334155",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: "4. Offer Validity: ", bold: true, size: 18, font: FONT_FAMILY }),
                  new TextRun({
                    text: "Please signify your acceptance of this offer by signing and returning this document no later than ",
                    size: 18,
                    color: "334155",
                    font: FONT_FAMILY,
                  }),
                  new TextRun({ text: formattedExpiryDate, bold: true, size: 18, color: NAVY_COLOR, font: FONT_FAMILY }),
                  new TextRun({ text: ".", size: 18, color: "334155", font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 8. Signatures Section (Two Cards Side-by-Side - Exact PDF Grid Design)
  const employerSignatory = offer.issued_by || offer.management_approved_by || "Head of Human Resources";
  const CARD_WIDTH = 4800;
  const GAP_WIDTH = 400;

  const signaturesTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Card 1: Authorized Employer Signatory
          new TableCell({
            width: { size: CARD_WIDTH, type: WidthType.DXA },
            borders: thinCardBorders,
            shading: { fill: "FAFAFA" },
            margins: { top: 110, bottom: 110, left: 130, right: 130 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 140 },
                children: [
                  new TextRun({
                    text: "AUTHORIZED EMPLOYER SIGNATURE",
                    bold: true,
                    size: 19,
                    color: NAVY_COLOR,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 200, after: 40 },
                children: [
                  new TextRun({
                    text: "__________________________________________",
                    color: TEXT_MUTED,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [new TextRun({ text: employerSignatory, bold: true, size: 19, color: TEXT_DARK, font: FONT_FAMILY })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [new TextRun({ text: `For & on behalf of ${buName}`, size: 17, color: TEXT_LIGHT_MUTED, font: FONT_FAMILY })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: `Date: ${formattedOfferDate}`, size: 17, color: TEXT_LIGHT_MUTED, font: FONT_FAMILY })],
              }),
            ],
          }),
          // Spacer
          new TableCell({
            width: { size: GAP_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [new Paragraph({ children: [] })],
          }),
          // Card 2: Candidate Acceptance Acknowledgment
          new TableCell({
            width: { size: CARD_WIDTH, type: WidthType.DXA },
            borders: thinCardBorders,
            shading: { fill: "FAFAFA" },
            margins: { top: 110, bottom: 110, left: 130, right: 130 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 140 },
                children: [
                  new TextRun({
                    text: "CANDIDATE ACCEPTANCE ACKNOWLEDGMENT",
                    bold: true,
                    size: 19,
                    color: NAVY_COLOR,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 200, after: 40 },
                children: [
                  new TextRun({
                    text: "__________________________________________",
                    color: TEXT_MUTED,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [new TextRun({ text: offer.candidate_name, bold: true, size: 19, color: TEXT_DARK, font: FONT_FAMILY })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [
                  new TextRun({
                    text: "I accept the offer on the terms and conditions outlined above.",
                    size: 17,
                    color: TEXT_LIGHT_MUTED,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "Signature & Date: _________________________", size: 17, color: TEXT_LIGHT_MUTED, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 9. Footer Bar
  const footerTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { before: 50, after: 0 },
                children: [
                  new TextRun({
                    text: `HRM_OPS Enterprise HRMS · ${buName}`,
                    size: 16,
                    color: "94A3B8",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 50, after: 0 },
                children: [
                  new TextRun({
                    text: `Confidential Employment Offer · Ref: ${offer.offer_number || "OFF-2026"} · Page 1 of 1`,
                    size: 16,
                    color: "94A3B8",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Assemble Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 700,
              bottom: 700,
              left: 953, // ~16.8mm margins
              right: 953,
            },
          },
        },
        children: [
          headerTopTable,
          headerDividerTable,
          metaTable,
          salutationTable,
          createSectionHeading("I. Position Details"),
          positionTable,
          createSectionHeading("II. Remuneration & Compensation Package"),
          remunerationTable,
          createSectionHeading("III. General Terms & Conditions"),
          termsTable,
          new Paragraph({ spacing: { before: 60, after: 40 }, children: [] }),
          signaturesTable,
          new Paragraph({ spacing: { before: 80, after: 40 }, children: [] }),
          footerTable,
        ],
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedName = (offer.candidate_name || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `Offer_Letter_${sanitizedName}_${offer.offer_number || "OFF"}.docx`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
    return true;
  } catch (err) {
    console.error("Failed to generate Offer Letter Word document:", err);
    throw err;
  }
}
