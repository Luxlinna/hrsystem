import type { EmployeeFormState } from "../../../types";

export interface PersonalSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}
