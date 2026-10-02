export interface AssetCategoryFormData {
  name: string;
  type: string;
  manageQuantity: boolean;
  allowRequest: boolean;
  trackSerialNumber: boolean;
  trackWarranty: boolean;
  trackTagging: boolean;
  tag: string;
  serialNumber?: string;
  sellerName?: string;
  invoiceRef?: string;
  serialNumbersList?: string[];
  imageUrl?: string | null;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
}

export interface AssetSettingData {
  propertyOf: string;
  taggingMode: "Manual" | "Auto";
  prefix: string;
  sequenceNumber: string;
  categoryTags: Record<string, string>;
}

export const CATEGORY_TYPES = [
  "Electronic Hardware",
  "Office Supply",
  "Furniture",
  "Vehicle & Fleet",
  "Network & Infrastructure",
  "Tools & Machinery",
  "Stationery",
  "Other",
];
