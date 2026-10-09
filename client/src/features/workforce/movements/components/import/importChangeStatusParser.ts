import type { MovementType, EmployeeMovement } from "../../types";

export interface ParsedMovementRow {
  rowNumber: number;
  effectiveDate: string;
  statusType: string;
  movementType: MovementType;
  employeeCode: string;
  employeeName: string;
  matchedEmployee?: any;
  division: string;
  department: string;
  position: string;
  bu: string;
  site: string;
  contractType: string;
  contractDate: string;
  employeeLevel: string;
  employeeType: string;
  supervisor: string;
  salary: string;
  salaryNum?: number;
  salaryAfterProbation: string;
  salaryAfterProbNum?: number;
  remarks: string;
  status: string;
  isValid: boolean;
  isDuplicate?: boolean;
  errors: string[];
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

export const normalizeDate = (val: any): string => {
  if (!val) return new Date().toISOString().split("T")[0];
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  if (!str || str === "—" || str === "-") return new Date().toISOString().split("T")[0];

  const ddMonyyyy = str.match(/^(\d{1,2})[/-]([a-zA-Z]{3,9})[/-](\d{4})$/);
  if (ddMonyyyy) {
    const day = ddMonyyyy[1].padStart(2, "0");
    const mStr = ddMonyyyy[2].toLowerCase().slice(0, 3);
    const mNum = MONTHS[mStr] || "01";
    return `${ddMonyyyy[3]}-${mNum}-${day}`;
  }

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

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return str;
};

export const mapStatusType = (raw: string): MovementType => {
  const norm = (raw || "").toLowerCase().trim();
  if (norm.includes("promo")) return "promote";
  if (norm.includes("transfer")) return "transfer";
  if (norm.includes("demot")) return "demote";
  if (norm.includes("pass") || norm.includes("confirmed")) return "pass_probation";
  if (norm.includes("probation")) return "probation";
  if (norm.includes("salary") || norm.includes("increment") || norm.includes("adjust") || norm.includes("increase")) return "salary_adjustment";
  if (norm.includes("contract") || norm.includes("renew")) return "change_contract";
  return "transfer";
};

const parseNum = (str?: string): number | undefined => {
  if (!str || str.includes("*") || str === "—" || str === "-") return undefined;
  const match = str.match(/[\d,.]+/);
  if (!match) return undefined;
  const num = parseFloat(match[0].replace(/,/g, ""));
  return isNaN(num) ? undefined : num;
};

const cleanStr = (s?: any) => String(s ?? "").toLowerCase().replace(/^(mr|mrs|ms|miss|dr|lok|lok chumteav)[\.\s]+/i, "").replace(/[^a-z0-9]/g, "");

export function parseMovementRows(
  rawData: Record<string, any>[],
  employees: any[],
  existingMovements: EmployeeMovement[] = []
): ParsedMovementRow[] {
  const empByCode = new Map<string, any>();
  const empByName = new Map<string, any>();

  employees.forEach((e) => {
    if (e.employee_code) {
      const code = String(e.employee_code).toLowerCase().trim();
      empByCode.set(code, e);
      empByCode.set(code.replace(/^0+/, ""), e);
      empByCode.set(cleanStr(code), e);
    }
    if (e.candidate_code) empByCode.set(cleanStr(e.candidate_code), e);
    if (e.biometric_user_id) {
      const bio = String(e.biometric_user_id).toLowerCase().trim();
      empByCode.set(bio, e);
      empByCode.set(cleanStr(bio), e);
    }
    if (e.id) empByCode.set(String(e.id).toLowerCase().trim(), e);

    const l = (e.last_name || "").trim();
    const f = (e.first_name || "").trim();
    if (l || f) {
      empByName.set(cleanStr(`${l} ${f}`), e);
      empByName.set(cleanStr(`${f} ${l}`), e);
    }
    if (e.display_name) empByName.set(cleanStr(e.display_name), e);
    if (e.full_name) empByName.set(cleanStr(e.full_name), e);
  });

  const seenInBatch = new Set<string>();

  return rawData.map((row, idx) => {
    const getVal = (colIdx: number, ...keys: string[]) => {
      for (const k of keys) {
        const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const rowKey of Object.keys(row)) {
          if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanKey) {
            const val = String(row[rowKey] || "").trim();
            if (val) return val;
          }
        }
      }
      if (row[`__col_${colIdx}`] != null && String(row[`__col_${colIdx}`]).trim() !== "") {
        return String(row[`__col_${colIdx}`]).trim();
      }
      return "";
    };

    const effectiveDateRaw = getVal(1, "effectivedate", "effective_date", "date");
    const statusTypeRaw = getVal(2, "statustype", "status_type", "type") || "Change Status";
    const employeeCodeRaw = getVal(3, "employeecode", "employee_code", "candidatecode", "code", "id");
    const employeeNameRaw = getVal(4, "employeename", "employee_name", "name", "employee", "fullname");
    const divisionRaw = getVal(5, "division");
    const departmentRaw = getVal(6, "department", "dept");
    const positionRaw = getVal(7, "position", "designation", "role");
    const buRaw = getVal(8, "businessunit", "businessunitbu", "bu", "branch");
    const siteRaw = getVal(9, "site", "worklocation", "location");
    const contractTypeRaw = getVal(10, "contracttype", "contract_type", "contract");
    const contractDateRaw = getVal(11, "contractdate", "contractperiod", "period", "joiningdate");
    const employeeLevelRaw = getVal(12, "employeelevel", "employee_level", "level");
    const employeeTypeRaw = getVal(13, "employeetype", "employee_type", "employmenttype");
    const supervisorRaw = getVal(14, "supervisor", "linemanager", "manager", "reports_to");
    const salaryRaw = getVal(15, "salary", "rate", "basicsalary", "amount");
    const salaryAfterProbRaw = getVal(16, "salaryafterprobation", "salary_after_probation", "afterprobationsalary");
    const remarkRaw = getVal(17, "remark", "remarks", "reason");
    const statusRaw = getVal(18, "status") || "Recorded";

    const errors: string[] = [];

    let matched = employeeCodeRaw ? (empByCode.get(employeeCodeRaw.toLowerCase().trim()) || empByCode.get(cleanStr(employeeCodeRaw))) : null;
    if (!matched && employeeNameRaw) {
      matched = empByName.get(cleanStr(employeeNameRaw));
      if (!matched) {
        const cn = cleanStr(employeeNameRaw);
        matched = employees.find((e) => {
          const el = cleanStr(e.last_name);
          const ef = cleanStr(e.first_name);
          return el && ef && cn.includes(el) && cn.includes(ef);
        });
      }
    }

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

    let salaryNum = parseNum(salaryRaw);
    if (salaryNum === undefined && matched) salaryNum = parseNum(String(matched.contract_rate ?? matched.basic_salary ?? ""));

    let salaryAfterProbNum = parseNum(salaryAfterProbRaw);
    if (salaryAfterProbNum === undefined && matched) salaryAfterProbNum = parseNum(String(matched.contract_rate_after ?? ""));

    const cleanField = (val: string, fallback: string = "—") => (!val || val === "-" || val === "—" ? fallback : val);

    return {
      rowNumber: idx + 1,
      effectiveDate,
      statusType: statusTypeRaw,
      movementType: movType,
      employeeCode: matched ? (matched.employee_code || matched.biometric_user_id || employeeCodeRaw) : employeeCodeRaw,
      employeeName: matched ? (`${matched.last_name || ""} ${matched.first_name || ""}`.trim() || matched.display_name || matched.full_name) : employeeNameRaw,
      matchedEmployee: matched,
      division: cleanField(divisionRaw, matched?.division || "—"),
      department: cleanField(departmentRaw, matched?.department || "General"),
      position: cleanField(positionRaw, matched?.role || "Staff"),
      bu: cleanField(buRaw, matched?.branches?.name || "Main BU"),
      site: cleanField(siteRaw, matched?.work_locations?.name || "Main Office"),
      contractType: cleanField(contractTypeRaw, matched?.contract_type || "FDC"),
      contractDate: cleanField(contractDateRaw, "Ongoing"),
      employeeLevel: cleanField(employeeLevelRaw, matched?.employee_level || "—"),
      employeeType: cleanField(employeeTypeRaw, matched?.employment_type || "Full Time"),
      supervisor: cleanField(supervisorRaw, matched?.supervisor || matched?.line_manager || "Pin Pisey"),
      salary: salaryNum != null ? `$${salaryNum.toFixed(2)}` : cleanField(salaryRaw, "—"),
      salaryNum,
      salaryAfterProbation: salaryAfterProbNum != null ? `$${salaryAfterProbNum.toFixed(2)}` : cleanField(salaryAfterProbRaw, "—"),
      salaryAfterProbNum,
      remarks: cleanField(remarkRaw, "—"),
      status: cleanField(statusRaw, "Recorded"),
      isValid: errors.length === 0,
      isDuplicate: isAlreadyInDb,
      errors,
    };
  });
}
