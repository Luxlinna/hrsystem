import { Document, Packer, Paragraph } from "docx";
import type { OfferLetter } from "../types";
import { resolveDocumentBranding } from "@/services/formLogoService";
import {
  getLogoBuffer,
  createSectionHeading,
} from "./offer-letter-word/offerLetterWordStyles";
import {
  buildOfferHeaderTopTable,
  buildOfferHeaderDividerTable,
  buildOfferMetaTable,
} from "./offer-letter-word/buildOfferHeaderSection";
import { buildOfferSalutationTable } from "./offer-letter-word/buildOfferSalutationTable";
import { buildOfferPositionTable } from "./offer-letter-word/buildOfferPositionTable";
import { buildOfferRemunerationTable } from "./offer-letter-word/buildOfferRemunerationTable";
import {
  buildOfferTermsTable,
  buildOfferFooterTable,
} from "./offer-letter-word/buildOfferTermsAndFooter";
import { buildOfferSignaturesTable } from "./offer-letter-word/buildOfferSignaturesTable";

export async function exportOfferLetterWord(
  offer: OfferLetter,
  buLogoCustom?: string,
  isHrDivisionContext?: boolean
): Promise<boolean> {
  const { logo: resolvedLogo, companyName: defaultBuName, isHrDivision } = resolveDocumentBranding({
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

  // Build Document Components
  const headerTopTable = buildOfferHeaderTopTable(buName, logoBytes);
  const headerDividerTable = buildOfferHeaderDividerTable();
  const metaTable = buildOfferMetaTable(formattedOfferDate, offer.offer_number);
  const salutationTable = buildOfferSalutationTable(offer, buName);
  const positionTable = buildOfferPositionTable(offer, buName, formattedStartDate);
  const remunerationTable = buildOfferRemunerationTable(offer, totalAllowances, totalPackage, isBasedOnQual);
  const termsTable = buildOfferTermsTable(offer, formattedExpiryDate);
  const signaturesTable = buildOfferSignaturesTable(offer, buName, formattedOfferDate);
  const footerTable = buildOfferFooterTable(buName, offer.offer_number);

  // Assemble Document with A4 margins
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 700,
              bottom: 700,
              left: 953,
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
