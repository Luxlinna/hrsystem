import type { OfferLetter } from "../../../../types";

export interface BasePanelProps {
  offer: OfferLetter;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
}
