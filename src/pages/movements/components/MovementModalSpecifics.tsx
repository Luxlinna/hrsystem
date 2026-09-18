import React from "react";
import { MOVEMENT_TYPES } from "../constants";
import type { useMovementFormState } from "./useMovementFormState";
import {
  ProbationFields,
  PassProbationFields,
  TransferFields,
  PromoteFields,
  DemoteFields,
  SalaryAdjustmentFields,
  ChangeContractFields,
} from "./movement-forms";

interface BranchOption {
  id: string;
  name: string;
}

interface WorkLocationOption {
  id: string;
  name: string;
  branch_id?: string;
}

interface MovementModalSpecificsProps {
  state: ReturnType<typeof useMovementFormState>;
  branches: BranchOption[];
  workLocations: WorkLocationOption[];
}

export function MovementModalSpecifics({ state, branches, workLocations }: MovementModalSpecificsProps) {
  const { movementType, selectedEmployee, selectedEmployeeBranchName } = state;

  return (
    <div className="p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 space-y-3.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
        <i className={MOVEMENT_TYPES[movementType].icon} />
        <span>{MOVEMENT_TYPES[movementType].label} Specifics</span>
      </div>

      {movementType === "probation" && (
        <ProbationFields
          probationMonths={state.probationMonths}
          onMonthsChange={state.setProbationMonths}
          probationEndDate={state.probationEndDate}
          onEndDateChange={state.setProbationEndDate}
        />
      )}
      {movementType === "pass_probation" && (
        <PassProbationFields
          rating={state.rating}
          onRatingChange={state.setRating}
          confirmedRole={state.confirmedRole}
          onConfirmedRoleChange={state.setConfirmedRole}
          defaultRole={selectedEmployee?.role}
        />
      )}
      {movementType === "transfer" && (
        <TransferFields
          targetBranchId={state.targetBranchId}
          onTargetBranchIdChange={state.setTargetBranchId}
          targetWorkLocationId={state.targetWorkLocationId}
          onTargetWorkLocationIdChange={state.setTargetWorkLocationId}
          targetDepartment={state.targetDepartment}
          onTargetDepartmentChange={state.setTargetDepartment}
          branches={branches}
          workLocations={workLocations}
          defaultDepartment={selectedEmployee?.department}
        />
      )}
      {movementType === "promote" && (
        <PromoteFields
          currentBranchName={selectedEmployeeBranchName}
          currentRole={selectedEmployee?.role}
          currentDepartment={selectedEmployee?.department}
          newRole={state.newRole}
          onNewRoleChange={state.setNewRole}
          newGrade={state.newGrade}
          onNewGradeChange={state.setNewGrade}
          salaryIncrease={state.salaryIncrease}
          onSalaryIncreaseChange={state.setSalaryIncrease}
        />
      )}
      {movementType === "demote" && (
        <DemoteFields
          demoteRole={state.demoteRole}
          onDemoteRoleChange={state.setDemoteRole}
          demoteReason={state.demoteReason}
          onDemoteReasonChange={state.setDemoteReason}
        />
      )}
      {movementType === "salary_adjustment" && (
        <SalaryAdjustmentFields
          adjustmentType={state.adjustmentType}
          onAdjustmentTypeChange={state.setAdjustmentType}
          currentSalary={state.currentSalary}
          onCurrentSalaryChange={state.setCurrentSalary}
          newSalary={state.newSalary}
          onNewSalaryChange={state.setNewSalary}
          currency={state.currency}
        />
      )}
      {movementType === "change_contract" && (
        <ChangeContractFields
          contractType={state.contractType}
          onContractTypeChange={state.setContractType}
          contractStartDate={state.contractStartDate}
          onContractStartDateChange={state.setContractStartDate}
          contractEndDate={state.contractEndDate}
          onContractEndDateChange={state.setContractEndDate}
        />
      )}
    </div>
  );
}
