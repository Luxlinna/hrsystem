import React from "react";
import type { useMovementFormState } from "./useMovementFormState";
import { MovementFormFields } from "@/features/workforce/employees/components/overview/movements/MovementFormFields";

interface MovementModalSpecificsProps {
  state: ReturnType<typeof useMovementFormState>;
}

export function MovementModalSpecifics({ state }: MovementModalSpecificsProps) {
  return (
    <MovementFormFields
      values={state.unifiedValues}
      onChange={state.handleUnifiedChange}
      file={state.documentFile}
      onFileChange={state.setDocumentFile}
    />
  );
}
