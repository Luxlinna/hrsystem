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
import CheckInOutModal from "./CheckInOutModal";

export default function TasksPage() {
  const {
    tasks,
    employees,
    assignableEmployees,
    loading,
    currentEmployeeId,
    fetchTasks,
    activities,
    loadingActivities,
    fetchActivities,
    viewMode,
    setViewMode,
    search,
    setSearch,
    assigneeFilter,
    setAssigneeFilter,
    priorityFilter,
    setPriorityFilter,
    quickTab,
    setQuickTab,
    filteredTasks,
    stats,
    saving,
    selectedTask,
    setSelectedTask,
    editingTask,
    setEditingTask,
    deletingTask,
    setDeletingTask,
    showCreateModal,
    setShowCreateModal,
    checkInOutTask,
    setCheckInOutTask,
    handleStatusChange,
    handleSaveTask,
    handleDeleteTask,
  } = useTasks();

  return (
    <div className="w-full min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-5 font-sans">
      {/* Top Header with Breadcrumbs & Action */}
      <TasksHeader onNewTask={() => setShowCreateModal(true)} />

      {/* 5 KPI Stats Cards Row */}
      <TasksStatsCards stats={stats} />

      {/* View Switcher, Search, Assignee & Quick Filter Pills Toolbar */}
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
        employees={employees}
      />

      {/* Main Content Views */}
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
          employees={employees}
          onSelectTask={setSelectedTask}
        />
      )}

      {/* Create / Edit Modal */}
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

      {/* Detailed Inspection Drawer */}
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

      {/* Delete Confirmation Modal */}
      <TaskDeleteModal
        task={deletingTask}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeletingTask(null)}
      />

      {/* Check In / Out Modal for Outside Work */}
      {checkInOutTask && (
        <CheckInOutModal
          taskId={checkInOutTask.task.id}
          employeeId={currentEmployeeId || checkInOutTask.task.assigned_to}
          mode={checkInOutTask.mode}
          onDone={fetchTasks}
          onClose={() => setCheckInOutTask(null)}
          showToast={(type, msg) => toast(type === "error" ? "Error" : "Success", msg, type as any)}
        />
      )}
    </div>
  );
}
