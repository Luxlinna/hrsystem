export interface WarningTypeSetting {
  id: string;
  name: string;
  alert_days_after: number;
  stop_alert_days: number;
  remark: string;
  status: "active" | "inactive";
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface WarningTypeFormData {
  name: string;
  alert_days_after: number;
  stop_alert_days: number;
  remark: string;
  status: "active" | "inactive";
  display_order: number;
}

export const DEFAULT_WARNING_TYPE_FORM: WarningTypeFormData = {
  name: "",
  alert_days_after: 0,
  stop_alert_days: 0,
  remark: "",
  status: "active",
  display_order: 1,
};
