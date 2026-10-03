import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  ImageRun,
  WidthType,
  BorderStyle,
  VerticalAlign,
} from "docx";
import {
  getOfficialFormLogo,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "@/services/formLogoService";
import { getLogoBuffer } from "./contractWordHelpers";

export function buildContractWordHeader(): Table {
  const logoBytes = getLogoBuffer(getOfficialFormLogo());
  const companyKhmer = getOfficialCompanyNameKhmer();
  const companyEnglish = getOfficialCompanyNameEnglish();

  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const bottomBorder = { style: BorderStyle.SINGLE, size: 12, color: "253C7D" };

  return new Table({
    width: { size: 10000, type: WidthType.DXA },
    borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1200, type: WidthType.DXA },
            borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: logoBytes
                  ? [
                      new ImageRun({
                        data: logoBytes,
                        transformation: { width: 56, height: 56 },
                        type: "png",
                      }),
                    ]
                  : [],
              }),
            ],
          }),
          new TableCell({
            width: { size: 8800, type: WidthType.DXA },
            borders: { top: noBorder, bottom: bottomBorder, left: noBorder, right: noBorder },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: companyKhmer,
                    bold: true,
                    font: "Kantumruy Pro",
                    size: 22, // 11pt
                    color: "0F172A",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: companyEnglish,
                    bold: true,
                    font: "Calibri",
                    size: 26, // 13pt
                    color: "253C7D",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Human Resources Management Division • Employment Governance",
                    font: "Calibri",
                    size: 18, // 9pt
                    color: "64748B",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
