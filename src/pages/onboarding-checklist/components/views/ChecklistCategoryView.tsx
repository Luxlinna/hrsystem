import { memo } from "react";
import type { ChecklistTask } from "../../types";
import { CategoryStageGroup } from "./CategoryStageGroup";

interface ChecklistCategoryViewProps {
  categories: string[];
  tasks: ChecklistTask[];
  isCategoryLocked: (category: string) => boolean;
  toggling: string | null;
  completerName: string;
  onToggle: (task: ChecklistTask) => void;
  onQuickAssign: (task: ChecklistTask) => void;
  onEdit: (task: ChecklistTask) => void;
  onDelete: (taskId: string) => void;
  onViewDetails: (task: ChecklistTask) => void;
  onMarkAllComplete: (categoryKey: string) => void;
  onOpenAddModal: (categoryKey: string) => void;
}

export const ChecklistCategoryView = memo(function ChecklistCategoryView({
  categories,
  tasks,
  isCategoryLocked,
  toggling,
  completerName,
  onToggle,
  onQuickAssign,
  onEdit,
  onDelete,
  onViewDetails,
  onMarkAllComplete,
  onOpenAddModal,
}: ChecklistCategoryViewProps) {
  return (
    <div className="space-y-4">
      {categories.map((catKey) => {
        const catTasks = tasks.filter((t) => t.category === catKey);
        const isLocked = isCategoryLocked(catKey);

        return (
          <CategoryStageGroup
            key={catKey}
            categoryKey={catKey}
            categoryTasks={catTasks}
            isLocked={isLocked}
            toggling={toggling}
            completerName={completerName}
            onToggle={onToggle}
            onQuickAssign={onQuickAssign}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetails={onViewDetails}
            onMarkAllComplete={onMarkAllComplete}
            onOpenAddModal={onOpenAddModal}
          />
        );
      })}
    </div>
  );
});
