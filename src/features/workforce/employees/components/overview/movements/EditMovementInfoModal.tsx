import React, { useState, useEffect } from "react";
import type { Employee } from "../../../types";
import type { EmployeeMovement } from "@/features/workforce/movements/types";
import { resolveMovementDisplayValues } from "./movementDisplayUtils";
import { saveMovementInfo } from "./editMovementService";
import { toast } from "@/components/Toast";
import { MovementFormFields, type MovementFormValues } from "./MovementFormFields";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  movement: EmployeeMovement | null;
  onSaved: (m: EmployeeMovement) => void;
}

const INITIAL_FORM: MovementFormValues = {
  title: "Initial Placement & Onboarding",
  effectiveDate: "",
  site: "",
  department: "",
  designation: "",
  contractType: "Standard Contract",
  contractStartDate: "",
  contractEndDate: "",
  employeeType: "FULL-TIME",
  supervisor: "",
  salary: "",
  salaryFreq: "Monthly",
  salaryAfter: "",
  salaryAfterFreq: "Monthly",
  remarks: "",
};

export const EditMovementInfoModal: React.FC<Props> = ({
  open,
  onClose,
  employee,
  movement,
  onSaved,
}) => {
  const [values, setValues] = useState<MovementFormValues>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const v = movement ? resolveMovementDisplayValues(movement, employee) : null;
    setValues({
      title: movement?.title || "Initial Placement & Onboarding",
      effectiveDate: movement?.effective_date || employee.join_date || new Date().toISOString().split("T")[0],
      site: v?.site && v.site !== "—" ? v.site : employee.site || employee.code_bu || "",
      department: v?.department && v.department !== "—" ? v.department : employee.department || "",
      designation: v?.designation && v.designation !== "—" ? v.designation : employee.role || employee.position || "",
      contractType: movement?.new_values?.contract_type || employee.contract_type || "Standard Contract",
      contractStartDate: movement?.new_values?.contract_start_date || employee.contract_effective_date || employee.start_date || employee.join_date || "",
      contractEndDate: movement?.new_values?.contract_end_date || employee.contract_end_date || employee.fdc_end_date || "",
      employeeType: movement?.new_values?.employment_type || employee.employment_type || "FULL-TIME",
      supervisor: v?.supervisor && v.supervisor !== "—" ? v.supervisor : employee.line_manager || "",
      salary: v?.rawSalary != null ? String(v.rawSalary) : "",
      salaryFreq: v?.salaryFreq || "Monthly",
      salaryAfter: v?.rawSalaryAfter != null ? String(v.rawSalaryAfter) : "",
      salaryAfterFreq: v?.salaryAfterFreq || "Monthly",
      remarks: movement?.remarks || employee.contract_remark || "",
    });
    setFile(null);
  }, [open, movement, employee]);

  if (!open) return null;

  const handleChange = (field: keyof MovementFormValues, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await saveMovementInfo(employee, movement, {
        title: values.title,
        effectiveDate: values.effectiveDate,
        site: values.site,
        department: values.department,
        designation: values.designation,
        contractType: values.contractType,
        contractStartDate: values.contractStartDate,
        contractEndDate: values.contractEndDate,
        employeeType: values.employeeType,
        supervisor: values.supervisor,
        salary: values.salary ? Number(values.salary) : null,
        salaryFreq: values.salaryFreq,
        salaryAfter: values.salaryAfter ? Number(values.salaryAfter) : null,
        salaryAfterFreq: values.salaryAfterFreq,
        remarks: values.remarks,
        file,
      });
      toast("Movement Updated", "Movement and contract information saved successfully.", "success");
      onSaved(updated);
      onClose();
    } catch (err: any) {
      toast("Save Error", err.message || "Failed to update movement info", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Edit Movement Information</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg">
            <i className="ri-close-line" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <MovementFormFields values={values} onChange={handleChange} file={file} onFileChange={setFile} />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
            <button type="button" onClick={onClose} disabled={saving} className="px-3.5 py-1.5 rounded border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold flex items-center gap-1.5 text-xs">
              {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
