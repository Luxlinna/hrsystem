import { toast } from "@/components/Toast";
import { useTasks } from "./hooks/useTasks";
import { TasksHeader } from "./components/TasksHeader";
import { TasksFilterBar } from "./components/TasksFilterBar";
import { TaskBoardView } from "./components/views/TaskBoardView";
import { TaskTableView } from "./components/views/TaskTableView";
import { TaskCalendarView } from "./components/views/TaskCalendarView";
import { TaskFormModal } from "./components/modals/TaskFormModal";
import { TaskDetailDrawer } from "./components/modals/TaskDetailDrawer";
import { TaskDeleteModal } from "./components/modals/TaskDeleteModal";
import CheckInOutModal from "./CheckInOutModal";

export default function TasksPage() {
  const {
    tasks,
    employees,
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
    outsideWorkOnly,
    setOutsideWorkOnly,
    overdueOnly,
    setOverdueOnly,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
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
    <div className="min-h-screen bg-[#F8F8F7] p-6 font-sans">
      {/* Top Header */}
      <TasksHeader
        stats={stats}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewTask={() => setShowCreateModal(true)}
      />

      {/* Filter and Search Bar */}
      <TasksFilterBar
        search={search}
        setSearch={setSearch}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        outsideWorkOnly={outsideWorkOnly}
        setOutsideWorkOnly={setOutsideWorkOnly}
        overdueOnly={overdueOnly}
        setOverdueOnly={setOverdueOnly}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        employees={employees}
      />

      {/* Main Content Area */}
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
        />
      ) : viewMode === "list" ? (
        <TaskTableView
          tasks={filteredTasks}
          onSelect={setSelectedTask}
          onEdit={setEditingTask}
          onDelete={setDeletingTask}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TaskCalendarView
          tasks={filteredTasks}
          onSelect={setSelectedTask}
        />
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingTask) && (
        <TaskFormModal
          editingTask={editingTask}
          employees={employees}
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

      {/* Check In / Out Modal */}
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
