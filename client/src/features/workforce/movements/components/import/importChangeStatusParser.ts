import type { MovementType, EmployeeMovement } from "../../types";

export interface ParsedMovementRow {
  rowNumber: number;
  effectiveDate: string;
  statusType: string;
  movementType: MovementType;
  employeeName: string;
  employeeCode: string;
  matchedEmployee?: any;
  bu: string;
  position: string;
  division: string;
  department: string;
  site: string;
  supervisor: string;
  joiningDate: string;
  contractType: string;
  contractPeriod: string;
  rate: string;
  salaryNum?: number;
  salaryAfterProbation?: string;
  salaryAfterProbNum?: number;
  status: string;
  remarks: string;
  isValid: boolean;
  isDuplicate?: boolean;
  errors: string[];
}

export const normalizeDate = (val: any): string => {
  if (!val) return new Date().toISOString().split("T")[0];
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
  }
  const yyyymmdd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (yyyymmdd) {
    return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, "0")}-${yyyymmdd[3].padStart(2, "0")}`;
  }
  if (typeof val === "number" || (!isNaN(Number(str)) && Number(str) > 20000 && Number(str) < 70000)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + Number(str) * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  return str;
};

export const mapStatusType = (raw: string): MovementType => {
  const norm = (raw || "").toLowerCase().trim();
  if (norm.includes("promo")) return "promote";
  if (norm.includes("transfer")) return "transfer";
  if (norm.includes("demot")) return "demote";
  if (norm.includes("pass") || norm.includes("confirmed")) return "pass_probation";
  if (norm.includes("probation")) return "probation";
  if (norm.includes("salary") || norm.includes("increment") || norm.includes("adjust")) return "salary_adjustment";
  if (norm.includes("contract") || norm.includes("renew")) return "change_contract";
  return "transfer";
};

const parseNum = (str?: string): number | undefined => {
  if (!str || str.includes("*")) return undefined;
  const match = str.match(/[\d,.]+/);
  if (!match) return undefined;
  const num = parseFloat(match[0].replace(/,/g, ""));
  return isNaN(num) ? undefined : num;
};

export function parseMovementRows(
  rawData: Record<string, any>[],
  employees: any[],
  existingMovements: EmployeeMovement[] = []
): ParsedMovementRow[] {
  const empByCode = new Map<string, any>();
  const empByName = new Map<string, any>();

  employees.forEach((e) => {
    if (e.employee_code) empByCode.set(String(e.employee_code).toLowerCase().trim(), e);
    if (e.candidate_code) empByCode.set(String(e.candidate_code).toLowerCase().trim(), e);
    const fName = (e.full_name || e.display_name || `${e.last_name || ""} ${e.first_name || ""}`).toLowerCase().trim();
    if (fName) empByName.set(fName, e);
    const altName = `${e.last_name || ""} ${e.first_name || ""}`.toLowerCase().trim();
    if (altName) empByName.set(altName, e);
  });

  const seenInBatch = new Set<string>();

  return rawData.map((row, idx) => {
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        for (const rowKey of Object.keys(row)) {
          if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")) {
            return String(row[rowKey] || "").trim();
          }
        }
      }
      return "";
    };

    const effectiveDateRaw = getVal("effectivedate", "effective_date", "date");
    const statusTypeRaw = getVal("statustype", "status_type", "type") || "Promotion";
    const employeeNameRaw = getVal("employeename", "employee_name", "name", "employee");
    const employeeCodeRaw = getVal("employeecode", "employee_code", "candidatecode", "code", "id");
    const buRaw = getVal("businessunit", "businessunitbu", "bu", "branch");
    const positionRaw = getVal("position", "designation", "role");
    const divisionRaw = getVal("division");
    const departmentRaw = getVal("department", "dept");
    const siteRaw = getVal("site", "worklocation", "location");
    const supervisorRaw = getVal("supervisor", "linemanager", "manager", "reports_to");
    const joiningDateRaw = getVal("joiningdate", "join_date", "start_date");
    const contractTypeRaw = getVal("contracttype", "contract_type", "contract");
    const contractPeriodRaw = getVal("contractperiod", "period");
    const rateRaw = getVal("rate", "salary", "basicsalary", "amount");
    const salaryAfterProbRaw = getVal("salaryafterprobation", "salary_after_probation", "afterprobationsalary");
    const statusRaw = getVal("status") || "Recorded";
    const remarksRaw = getVal("remarks", "remark", "reason");

    const errors: string[] = [];

    let matched = employeeCodeRaw ? empByCode.get(employeeCodeRaw.toLowerCase()) : null;
    if (!matched && employeeNameRaw) matched = empByName.get(employeeNameRaw.toLowerCase());

    if (!matched) errors.push(`Employee not found (${employeeCodeRaw || employeeNameRaw || "Missing"})`);

    const effectiveDate = normalizeDate(effectiveDateRaw);
    if (!effectiveDate || effectiveDate === "—") errors.push("Invalid Effective Date");

    const movType = mapStatusType(statusTypeRaw);
    const dedupeKey = `${matched?.id || employeeCodeRaw || employeeNameRaw}_${effectiveDate}_${movType}`.toLowerCase();

    const isAlreadyInDb = matched && existingMovements.some(
      (em) => (em.employee_id === matched.id || em.employees?.id === matched.id) &&
              em.effective_date === effectiveDate &&
              (em.movement_type === movType || em.title?.toLowerCase() === statusTypeRaw.toLowerCase())
    );

    if (isAlreadyInDb) {
      errors.push("Already exists in system");
    } else if (seenInBatch.has(dedupeKey)) {
      errors.push("Duplicate entry in file");
    } else {
      seenInBatch.add(dedupeKey);
    }

    let salaryNum = parseNum(rateRaw);
    if (salaryNum === undefined && matched) {
      salaryNum = parseNum(String(matched.contract_rate ?? matched.basic_salary ?? ""));
    }

    let salaryAfterProbNum = parseNum(salaryAfterProbRaw);
    if (salaryAfterProbNum === undefined && matched) {
      salaryAfterProbNum = parseNum(String(matched.contract_rate_after ?? ""));
    }

    const finalRate = salaryNum != null ? `${salaryNum} USD` : rateRaw || "—";

    return {
      rowNumber: idx + 1,
      effectiveDate,
      statusType: statusTypeRaw,
      movementType: movType,
      employeeName: matched ? (matched.full_name || matched.display_name || `${matched.last_name} ${matched.first_name}`) : employeeNameRaw,
      employeeCode: matched ? (matched.employee_code || matched.candidate_code || employeeCodeRaw) : employeeCodeRaw,
      matchedEmployee: matched,
      bu: buRaw || matched?.branches?.name || "Main BU",
      position: positionRaw || matched?.role || "Staff",
      division: divisionRaw || matched?.division || "—",
      department: departmentRaw || matched?.department || "General",
      site: siteRaw || matched?.work_locations?.name || "Main Office",
      supervisor: supervisorRaw || matched?.supervisor || matched?.line_manager || "—",
      joiningDate: joiningDateRaw,
      contractType: contractTypeRaw || matched?.contract_type || "FDC",
      contractPeriod: contractPeriodRaw,
      rate: finalRate,
      salaryNum,
      salaryAfterProbation: salaryAfterProbRaw,
      salaryAfterProbNum,
      status: statusRaw,
      remarks: remarksRaw,
      isValid: errors.length === 0,
      isDuplicate: isAlreadyInDb,
      errors,
    };
  });
}
