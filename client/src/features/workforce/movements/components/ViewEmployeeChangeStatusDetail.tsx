import React, { useState, useEffect } from "react";
import type { EmployeeMovement } from "../types";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";
import { DetailEmployeeInfo } from "./detail/DetailEmployeeInfo";
import { DetailContractAndRateItems } from "./detail/DetailContractAndRateItems";
import { MovementHistoryGridCard } from "./detail/MovementHistoryGridCard";
import { fetchMovementsByEmployeeId } from "../services/movementService";
import { DEFAULT_PAYROLL_RATE_ITEMS } from "@/features/workforce/employees/constants";

interface ViewEmployeeChangeStatusDetailProps {
  movement: EmployeeMovement;
  onBack: () => void;
}

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

const resolveSalaryNum = (...candidates: any[]): string => {
  for (const c of candidates) {
    if (c !== null && c !== undefined && c !== "" && c !== "—" && !String(c).includes("*")) {
      const match = String(c).match(/[\d,.]+/);
      if (match) {
        const parsed = parseFloat(match[0].replace(/,/g, ""));
        if (!isNaN(parsed) && parsed > 0) {
          return parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
    }
  }
  return "100.00";
};

export const ViewEmployeeChangeStatusDetail: React.FC<ViewEmployeeChangeStatusDetailProps> = ({
  movement,
  onBack,
}) => {
  const [showRate, setShowRate] = useState(false);
  const [allMovements, setAllMovements] = useState<EmployeeMovement[]>([movement]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>(movement.id);
  const [viewAll, setViewAll] = useState<boolean>(false);

  useEffect(() => {
    if (!movement.employee_id) return;
    fetchMovementsByEmployeeId(movement.employee_id)
      .then((records) => {
        if (records && records.length > 0) {
          // Sort chronologically ascending (Join -> ... -> Latest)
          const sorted = [...records].sort((a, b) => {
            const tA = new Date(a.effective_date || a.created_at || 0).getTime();
            const tB = new Date(b.effective_date || b.created_at || 0).getTime();
            return tA - tB;
          });
          setAllMovements(sorted);
        }
      })
      .catch((err) => {
        console.warn("Failed to load employee movements:", err);
      });
  }, [movement.employee_id]);

  const activeMovement = allMovements.find((m) => m.id === selectedRecordId) || movement;
  const emp = activeMovement.employees || movement.employees;
  const fullName = formatKhmerFullName(emp);

  const employeeCode = (emp as any)?.employee_code || (emp as any)?.candidate_code || (emp as any)?.id?.slice(0, 8) || movement.employee_id?.slice(0, 8) || "117";
  const designation = activeMovement.new_values?.position || activeMovement.new_values?.role || (emp as any)?.position || emp?.role || "Staff";
  const department = (activeMovement.new_values?.department || emp?.department || "—").toUpperCase();
  const supervisorName = activeMovement.new_values?.supervisor || (emp as any)?.line_manager || (emp as any)?.supervisor || (emp as any)?.reports_to || "—";
  const employmentType = (activeMovement.new_values?.employment_type || (emp as any)?.employment_type || "FULL-TIME").toUpperCase();
  const contractType = activeMovement.new_values?.contract_type || (emp as any)?.contract_type || "2-YEAR FDC";
  const siteName = activeMovement.new_values?.site || (emp as any)?.work_locations?.name || (emp as any)?.site || "—";
  const joiningDate = formatDate((emp as any)?.join_date || (emp as any)?.start_date || activeMovement.effective_date);

  const salary = resolveSalaryNum(
    activeMovement.new_values?.salary,
    activeMovement.new_values?.new_salary,
    activeMovement.new_values?.rate,
    (emp as any)?.contract_rate,
    (emp as any)?.basic_salary
  );

  const contractStart = formatDate((emp as any)?.contract_start_date || (emp as any)?.start_date || activeMovement.effective_date);
  let contractEnd = (emp as any)?.contract_end_date ? formatDate((emp as any)?.contract_end_date) : "";
  if (!contractEnd || contractEnd === "—") {
    if (contractType.toUpperCase().includes("2-YEAR") || contractType.toUpperCase().includes("2 YEAR")) {
      try {
        const s = new Date((emp as any)?.start_date || activeMovement.effective_date);
        if (!isNaN(s.getTime())) {
          const end = new Date(s);
          end.setFullYear(end.getFullYear() + 2);
          contractEnd = formatDate(end.toISOString());
        }
      } catch {
        contractEnd = "Ongoing";
      }
    } else {
      contractEnd = "Ongoing";
    }
  }

  const rateItems = (emp as any)?.rate_items && (emp as any).rate_items.length > 0
    ? (emp as any).rate_items
    : DEFAULT_PAYROLL_RATE_ITEMS;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 font-sans space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h1 className="text-xl font-normal text-slate-700 tracking-tight">
          View Employee Change Status Detail
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1 rounded-sm bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
        >
          <i className="ri-arrow-left-line text-xs" />
          <span>Back</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 space-y-8 rounded-none shadow-2xs">
        <DetailEmployeeInfo
          emp={emp}
          fullName={fullName}
          employeeCode={employeeCode}
          designation={designation}
          department={department}
          supervisorName={supervisorName}
          employmentType={employmentType}
          contractType={contractType}
          siteName={siteName}
          joiningDate={joiningDate}
          salary={salary}
          showRate={showRate}
          onToggleRate={() => setShowRate(!showRate)}
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider">
              CHANGE STATUS INFO {allMovements.length > 1 && `(${allMovements.length} Records)`}
            </h2>

            {allMovements.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {allMovements.map((m) => {
                  const isSelected = !viewAll && m.id === activeMovement.id;
                  const label = m.title || m.movement_type?.replace(/_/g, " ") || "Record";
                  const date = formatDate(m.effective_date);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setViewAll(false);
                        setSelectedRecordId(m.id);
                      }}
                      className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#253C7D] text-white font-semibold shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 font-normal"
                      }`}
                    >
                      {label} ({date})
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setViewAll(!viewAll)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                    viewAll
                      ? "bg-[#253C7D] text-white font-semibold shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 font-normal"
                  }`}
                >
                  View All
                </button>
              </div>
            )}
          </div>

          {viewAll ? (
            <div className="space-y-6">
              {allMovements.map((m, idx) => (
                <MovementHistoryGridCard
                  key={m.id || idx}
                  movement={m}
                  isCurrent={idx === allMovements.length - 1}
                />
              ))}
            </div>
          ) : (
            <MovementHistoryGridCard
              movement={activeMovement}
              isCurrent={activeMovement.id === allMovements[allMovements.length - 1]?.id}
            />
          )}
        </div>

        <DetailContractAndRateItems
          contractType={contractType}
          contractPeriod={`${contractStart} - ${contractEnd}`}
          rateItems={rateItems}
          documentUrl={activeMovement.document_url || movement.document_url}
          documentName={activeMovement.document_name || movement.document_name}
        />
      </div>
    </div>
  );
};

