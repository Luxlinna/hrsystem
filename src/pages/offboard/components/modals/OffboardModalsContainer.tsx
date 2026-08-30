import { memo } from "react";
import { CreateOffboardingModal } from "./CreateOffboardingModal";
import { AddTaskModal } from "./AddTaskModal";
import { EditOffboardingModal } from "./EditOffboardingModal";
import type {
  EmployeeOption,
  CreateOffboardingForm,
  AddTaskForm,
  EditOffboardingForm,
  Offboarding,
} from "../../types";

interface OffboardModalsContainerProps {
  createModal: boolean;
  setCreateModal: (val: boolean) => void;
  newForm: CreateOffboardingForm;
  setNewForm: React.Dispatch<React.SetStateAction<CreateOffboardingForm>>;
  employees: EmployeeOption[];
  submitting: boolean;
  createOffboarding: (e: React.FormEvent) => Promise<void>;

  taskModal: { open: boolean; offboardingId: string | null };
  setTaskModal: (val: { open: boolean; offboardingId: string | null }) => void;
  newTaskForm: AddTaskForm;
  setNewTaskForm: React.Dispatch<React.SetStateAction<AddTaskForm>>;
  submittingTask: boolean;
  handleAddTask: (e: React.FormEvent) => Promise<void>;

  editingOffboarding: Offboarding | null;
  setEditingOffboarding: (val: Offboarding | null) => void;
  editForm: EditOffboardingForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditOffboardingForm>>;
  savingEdit: boolean;
  handleSaveEdit: (e: React.FormEvent) => Promise<void>;
}

export const OffboardModalsContainer = memo(function OffboardModalsContainer({
  createModal,
  setCreateModal,
  newForm,
  setNewForm,
  employees,
  submitting,
  createOffboarding,
  taskModal,
  setTaskModal,
  newTaskForm,
  setNewTaskForm,
  submittingTask,
  handleAddTask,
  editingOffboarding,
  setEditingOffboarding,
  editForm,
  setEditForm,
  savingEdit,
  handleSaveEdit,
}: OffboardModalsContainerProps) {
  return (
    <>
      <CreateOffboardingModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        newForm={newForm}
        setNewForm={setNewForm}
        employees={employees}
        submitting={submitting}
        onSubmit={createOffboarding}
      />

      <AddTaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, offboardingId: null })}
        newTaskForm={newTaskForm}
        setNewTaskForm={setNewTaskForm}
        submitting={submittingTask}
        onSubmit={handleAddTask}
      />

      <EditOffboardingModal
        editingOffboarding={editingOffboarding}
        onClose={() => setEditingOffboarding(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        savingEdit={savingEdit}
        onSubmit={handleSaveEdit}
      />
    </>
  );
});
