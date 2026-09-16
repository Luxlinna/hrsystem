export type ExitSettingTab = "exit-type" | "reason-type";

export interface ExitTypeSetting {
  id: string;
  name: string;
  code?: string | null;
  status: "active" | "inactive";
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExitReasonTypeSetting {
  id: string;
  name: string;
  status: "active" | "inactive";
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SettingFormData {
  name: string;
  status: "active" | "inactive";
  display_order: number;
}

export const DEFAULT_SETTING_FORM: SettingFormData = {
  name: "",
  status: "active",
  display_order: 1,
};
