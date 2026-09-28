import React, { useState, useEffect } from "react";
import type { Employee } from "../../../types";
import type { EmployeeMovement } from "@/pages/movements/types";
import { applyNewMovement } from "./editMovementService";
import { toast } from "@/components/Toast";
import { MovementFormFields, type MovementFormValues } from "./MovementFormFields";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  onSaved: (m: EmployeeMovement) => void;
}

const DEFAULT_FORM: MovementFormValues = {
  title: "Promotion",
  effectiveDate: new Date().toISOString().split("T")[0],
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

export const ApplyMovementModal: React.FC<Props> = ({
  open,
  onClose,
  employee,
  onSaved,
}) => {
  const [values, setValues] = useState<MovementFormValues>(DEFAULT_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({
      title: "Promotion",
      effectiveDate: new Date().toISOString().split("T")[0],
      site: employee.site || employee.code_bu || "",
      department: employee.department || "",
      designation: employee.role || employee.position || "",
      contractType: employee.contract_type || "Standard Contract",
      contractStartDate: employee.contract_effective_date || employee.join_date || "",
      contractEndDate: employee.contract_end_date || employee.fdc_end_date || "",
      employeeType: employee.employment_type || "FULL-TIME",
      supervisor: employee.line_manager || "",
      salary: employee.basic_salary != null ? String(employee.basic_salary) : (employee.contract_rate != null ? String(employee.contract_rate) : ""),
      salaryFreq: employee.contract_rate_frequency || "Monthly",
      salaryAfter: employee.contract_rate_after != null ? String(employee.contract_rate_after) : "",
      salaryAfterFreq: employee.contract_rate_after_frequency || "Monthly",
      remarks: "",
    });
    setFile(null);
  }, [open, employee]);

  if (!open) return null;

  const handleChange = (field: keyof MovementFormValues, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      toast("Validation Error", "Movement title is required", "error");
      return;
    }
    setSaving(true);
    try {
      const created = await applyNewMovement(employee, {
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
      toast("Movement Applied", "New employee movement recorded successfully.", "success");
      onSaved(created);
      onClose();
    } catch (err: any) {
      toast("Save Error", err.message || "Failed to record movement", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 bg-sky-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <i className="ri-route-line text-sky-600 dark:text-sky-400 font-bold" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
              Apply Employee Movement &mdash; {employee.first_name} {employee.last_name}
            </h3>
          </div>
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
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded bg-[#253C7D] hover:bg-[#1d2f60] text-white font-semibold flex items-center gap-1.5 text-xs shadow-xs">
              {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{saving ? "Applying..." : "Apply Movement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
