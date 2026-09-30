import { memo, useState, useEffect } from "react";
import type { Branch, EmployeeFormState } from "../../types";
import { AddEmployeeModal } from "../AddEmployeeModal";
import type { ParsedEmployeeRow } from "./types";
import { hydrateFormFromParsedRow, extractParsedRowFromForm } from "./formHydrator";

interface ImportRowEditModalProps {
  row: ParsedEmployeeRow | null;
  branches: Branch[];
  isOpen: boolean;
  onClose: () => void;
  onSaveRow: (updatedRow: ParsedEmployeeRow) => void;
}

export const ImportRowEditModal = memo(function ImportRowEditModal({
  row,
  branches,
  isOpen,
  onClose,
  onSaveRow,
}: ImportRowEditModalProps) {
  const [form, setForm] = useState<EmployeeFormState>(() =>
    row ? hydrateFormFromParsedRow(row, branches) : ({} as EmployeeFormState)
  );

  useEffect(() => {
    if (isOpen && row) {
      setForm(hydrateFormFromParsedRow(row, branches));
    }
  }, [isOpen, row, branches]);

  if (!isOpen || !row) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = extractParsedRowFromForm(form, row.rowNumber);
    onSaveRow(updated);
    onClose();
  };

  return (
    <AddEmployeeModal
      isOpen={isOpen}
      isEdit={true}
      form={form}
      setForm={setForm}
      branches={branches}
      managers={[]}
      submitting={false}
      isSuperAdmin={true}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
});
