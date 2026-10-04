import type { StageConfig } from "./types";

export const STAGES: StageConfig[] = [
  {
    key: "document",
    label: "Document Collection",
    shortLabel: "Docs",
    description: "Offer letter, ID verification, contract & bank forms",
    icon: "ri-file-list-3-line",
  },
  {
    key: "it_setup",
    label: "IT & Equipment Setup",
    shortLabel: "IT Setup",
    description: "Laptop provisioning, corporate email & access",
    icon: "ri-macbook-line",
  },
  {
    key: "training",
    label: "Training & Orientation",
    shortLabel: "Training",
    description: "HR orientation, team intro & role roadmap",
    icon: "ri-presentation-line",
  },
  {
    key: "complete",
    label: "Final Sign-off",
    shortLabel: "Sign-off",
    description: "Probation roadmap, checklist sign-off & go-live",
    icon: "ri-checkbox-circle-line",
  },
];

export const DEADLINE_PRESETS = [
  { label: "+1 day", days: 1 },
  { label: "+3 days", days: 3 },
  { label: "+1 week", days: 7 },
  { label: "+2 weeks", days: 14 },
  { label: "+1 month", days: 30 },
  { label: "+3 months", days: 90 },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "name", label: "Employee Name" },
  { value: "progress", label: "Progress" },
  { value: "days", label: "Days in Onboarding" },
];
