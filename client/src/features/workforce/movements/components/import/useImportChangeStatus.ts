import { useState } from "react";
import { toast } from "@/components/Toast";
import { recordEmployeeMovement } from "../../services/movementService";
import type { ParsedMovementRow } from "./importChangeStatusParser";

interface UseImportChangeStatusParams {
  branches: { id: string; name: string }[];
  workLocations?: { id: string; name: string; branch_id?: string }[];
  onSuccess?: () => void;
  onClose: () => void;
}

export function useImportChangeStatus({
  branches,
  workLocations = [],
  onSuccess,
  onClose,
}: UseImportChangeStatusParams) {
  const [isImporting, setIsImporting] = useState(false);

  const commitImport = async (parsedRows: ParsedMovementRow[]) => {
    const valid = parsedRows.filter((r) => r.isValid && r.matchedEmployee && !r.isDuplicate);
    if (valid.length === 0) {
      toast("No Valid Records", "Please fix errors or duplicate entries before importing.", "error");
      return;
    }

    const sorted = [...valid].sort(
      (a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
    );

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of sorted) {
      try {
        const emp = item.matchedEmployee;
        const matchedBranch = branches.find((b) => b.name.toLowerCase() === item.bu.toLowerCase() || b.id === item.bu);
        const matchedLoc = workLocations.find((w) => w.name.toLowerCase() === item.site.toLowerCase() || w.id === item.site);

        const effectiveSalary = item.salaryNum ?? emp.contract_rate ?? emp.basic_salary;
        const effectiveSalaryAfter = item.salaryAfterProbNum ?? emp.contract_rate_after;

        await recordEmployeeMovement({
          form: {
            employee_id: emp.id,
            movement_type: item.movementType,
            title: item.statusType,
            effective_date: item.effectiveDate,
            remarks: item.remarks || `Recorded status change: ${item.statusType}`,
            bu: item.bu,
            bu_full_name: item.bu,
            site: item.site,
            target_branch_id: matchedBranch?.id || emp.branch_id,
            target_work_location_id: matchedLoc?.id || emp.default_work_location_id,
            division: item.division !== "—" ? item.division : emp.division,
            department: item.department,
            target_department: item.department,
            designation: item.position,
            position: item.position,
            new_role: item.position,
            employee_type: emp.employment_type || "FULL-TIME",
            contract_type: item.contractType,
            salary: effectiveSalary,
            new_salary: effectiveSalary,
            salary_after: effectiveSalaryAfter,
            supervisor: item.supervisor !== "—" ? item.supervisor : undefined,
          },
          employee: emp,
          currentUser: { displayName: "HR Admin" },
        });
        successCount++;
      } catch (err) {
        console.error("Error importing row:", item, err);
        failCount++;
      }
    }

    setIsImporting(false);
    if (successCount > 0) {
      toast("Import Complete", `Successfully imported ${successCount} change status records.${failCount > 0 ? ` (${failCount} failed)` : ""}`, "success");
      onSuccess?.();
      onClose();
    } else {
      toast("Import Failed", "Failed to create change status records.", "error");
    }
  };

  return { isImporting, commitImport };
}
