export interface AvailableAssetItem {
  id: string;
  name: string;
  category: string;
  subType?: string;
  tag: string;
  serial?: string;
  branch_id?: string | null;
  branch_name?: string | null;
  status?: string;
}

export interface AssignFormState {
  assignFor: "Full Day" | "Half Day" | "Hourly";
  fromDate: string;
  toDateNever: boolean;
  toDate: string;
  remark: string;
}
