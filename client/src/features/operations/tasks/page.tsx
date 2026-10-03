import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useTasks } from "./hooks/useTasks";
import { TasksHeader } from "./components/TasksHeader";
import { TasksStatsCards } from "./components/TasksStatsCards";
import { TasksFilterBar } from "./components/TasksFilterBar";
import { TaskBoardView } from "./components/views/TaskBoardView";
import { TaskTableView } from "./components/views/TaskTableView";
import { TaskCalendarView } from "./components/views/TaskCalendarView";
import { TaskReportsView } from "./components/views/TaskReportsView";
import { TaskFormModal } from "./components/modals/TaskFormModal";
import { TaskDetailDrawer } from "./components/modals/TaskDetailDrawer";
import { TaskDeleteModal } from "./components/modals/TaskDeleteModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import CheckInOutModal from "./CheckInOutModal";

export default function TasksPage() {
  const {
    isPartnerBranchBlocked, userBranchName, userBranchId, tasks, employees,
    managedEmployees, assignableEmployees, isManager, hasSubordinates, loading,
    currentEmployeeId, fetchTasks, activities, loadingActivities, fetchActivities,
    viewMode, setViewMode, search, setSearch, assigneeFilter, setAssigneeFilter,
    priorityFilter, setPriorityFilter, quickTab, setQuickTab, filteredTasks,
    stats, saving, selectedTask, setSelectedTask, editingTask, setEditingTask,
    deletingTask, setDeletingTask, showCreateModal, setShowCreateModal,
    checkInOutTask, setCheckInOutTask, handleStatusChange, handleSaveTask, handleDeleteTask,
  } = useTasks();

  if (isPartnerBranchBlocked) {
    return (
      <div className="w-full min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-5 font-sans">
        <TasksHeader onNewOutsideWork={() => {}} />
        <PartnerBranchPrivacyShield
          moduleName="Task Management"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  const handleCheckInOutDone = async () => {
    await fetchTasks();
    if (selectedTask) {
      const { data: fresh } = await supabase
        .from("tasks")
        .select("id, title, description, assigned_to, assigned_by, status, priority, due_date, completed_at, created_at, is_outside_work, work_status, work_checked_in_at, work_checked_out_at, work_lat, work_lng, work_accuracy_m, work_address, work_image_url, work_check_out_lat, work_check_out_lng, work_check_out_accuracy_m, work_check_out_address, work_check_out_image_url, work_media_urls, work_check_out_media_urls, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url, branch_id)")
        .eq("id", selectedTask.id)
        .maybeSingle();
      if (fresh) setSelectedTask(fresh as any);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Mobile Coming Soon View */}
      <div className="block md:hidden min-h-[65vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-3xl mb-4 shadow-sm border border-sky-100 dark:border-sky-900/50">
          <i className="ri-task-line" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Coming Soon</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
          Task Management is currently under development for mobile and will be available soon.
        </p>
      </div>

      {/* Desktop Portal View */}
      <div className="hidden md:block space-y-5">
        <TasksHeader onNewOutsideWork={() => setShowCreateModal(true)} />
        <TasksStatsCards stats={stats} />

        <TasksFilterBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          search={search}
          setSearch={setSearch}
          assigneeFilter={assigneeFilter}
          setAssigneeFilter={setAssigneeFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          quickTab={quickTab}
          setQuickTab={setQuickTab}
          employees={managedEmployees || employees}
          isManager={isManager}
          hasSubordinates={hasSubordinates}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-gray-500">Loading tasks &amp; field records...</p>
          </div>
        ) : viewMode === "board" ? (
          <TaskBoardView
            tasks={filteredTasks}
            onSelect={setSelectedTask}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onStatusChange={handleStatusChange}
            onCheckInOut={(task, mode) => setCheckInOutTask({ task, mode })}
            onQuickCreate={() => setShowCreateModal(true)}
          />
        ) : viewMode === "list" ? (
          <TaskTableView
            tasks={filteredTasks}
            onSelect={setSelectedTask}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onStatusChange={handleStatusChange}
          />
        ) : viewMode === "calendar" ? (
          <TaskCalendarView
            tasks={filteredTasks}
            onSelect={setSelectedTask}
          />
        ) : (
          <TaskReportsView
            tasks={tasks}
            employees={managedEmployees || employees}
            onSelectTask={setSelectedTask}
            assigneeFilter={assigneeFilter}
            priorityFilter={priorityFilter}
            search={search}
            quickTab={quickTab}
            currentEmployeeId={currentEmployeeId}
          />
        )}
      </div>

      {(showCreateModal || editingTask) && (
        <TaskFormModal
          editingTask={editingTask}
          employees={assignableEmployees || employees}
          currentEmployeeId={currentEmployeeId}
          saving={saving}
          onSave={handleSaveTask}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
        />
      )}

      <TaskDetailDrawer
        task={selectedTask}
        activities={activities}
        loadingActivities={loadingActivities}
        onFetchActivities={fetchActivities}
        onClose={() => setSelectedTask(null)}
        onEdit={setEditingTask}
        onDelete={setDeletingTask}
        onStatusChange={handleStatusChange}
        onCheckInOut={(task, mode) => setCheckInOutTask({ task, mode })}
      />

      <TaskDeleteModal
        task={deletingTask}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeletingTask(null)}
      />

      {checkInOutTask && (
        <CheckInOutModal
          taskId={checkInOutTask.task.id}
          employeeId={currentEmployeeId || checkInOutTask.task.assigned_to}
          task={checkInOutTask.task}
          mode={checkInOutTask.mode}
          onDone={handleCheckInOutDone}
          onClose={() => setCheckInOutTask(null)}
          showToast={(type, msg) => toast(type === "error" ? "Error" : "Success", msg, type as any)}
        />
      )}
    </div>
  );
}
