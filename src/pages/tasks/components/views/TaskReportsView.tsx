import { memo, useState, useMemo } from "react";
import type { Task, Employee } from "../../types";
import { TaskReportsToolbar } from "./TaskReportsToolbar";
import { TaskReportEmployeeCard, type EmployeeReportData } from "./TaskReportEmployeeCard";

interface TaskReportsViewProps {
  tasks: Task[];
  employees: Employee[];
  onSelectTask: (task: Task) => void;
  assigneeFilter?: string;
  priorityFilter?: string;
  search?: string;
  quickTab?: "all" | "team" | "my" | "urgent";
  currentEmployeeId?: string | null;
}

export const TaskReportsView = memo(function TaskReportsView({
  tasks,
  employees,
  onSelectTask,
  assigneeFilter = "all",
  priorityFilter = "all",
  search = "",
  quickTab = "all",
  currentEmployeeId,
}: TaskReportsViewProps) {
  const [reportSearch, setReportSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeExportMenu, setActiveExportMenu] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.department && set.add(e.department));
    return Array.from(set).sort();
  }, [employees]);

  const dateFilteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return tasks.filter((t) => {
      // Global top filter bar checks
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (quickTab === "urgent" && t.priority !== "high" && t.priority !== "urgent") return false;
      if (quickTab === "my" && currentEmployeeId && t.assigned_to !== currentEmployeeId) return false;
      if (quickTab === "team" && currentEmployeeId && t.assigned_to === currentEmployeeId) return false;
      if (assigneeFilter !== "all" && t.assigned_to !== assigneeFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        const matchAssignee = `${t.employees?.first_name || ""} ${t.employees?.last_name || ""}`.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee) return false;
      }

      // Date range filtering
      const taskDate = t.due_date || t.created_at.slice(0, 10);
      if (datePreset === "today") return taskDate === todayStr;
      if (datePreset === "week") {
        const diff = (now.getTime() - new Date(taskDate).getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (datePreset === "month") {
        return taskDate.startsWith(todayStr.slice(0, 7));
      }
      if (datePreset === "custom") {
        if (customFrom && taskDate < customFrom) return false;
        if (customTo && taskDate > customTo) return false;
      }
      return true;
    });
  }, [tasks, priorityFilter, quickTab, currentEmployeeId, assigneeFilter, search, datePreset, customFrom, customTo]);

  const employeeReports: EmployeeReportData[] = useMemo(() => {
    return employees
      .filter((e) => {
        // Strict assignee filter from top filter bar
        if (assigneeFilter !== "all" && e.id !== assigneeFilter) return false;

        // Quick tabs from top filter bar
        if (quickTab === "my" && currentEmployeeId && e.id !== currentEmployeeId) return false;
        if (quickTab === "team" && currentEmployeeId && e.id === currentEmployeeId) return false;

        // Department filter
        if (deptFilter !== "all" && e.department !== deptFilter) return false;

        // Top bar text search
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const name = `${e.first_name} ${e.last_name}`.toLowerCase();
          const dept = (e.department || "").toLowerCase();
          if (!name.includes(q) && !dept.includes(q)) return false;
        }

        // Toolbar local report search
        if (reportSearch.trim()) {
          const q = reportSearch.toLowerCase().trim();
          const name = `${e.first_name} ${e.last_name}`.toLowerCase();
          const dept = (e.department || "").toLowerCase();
          if (!name.includes(q) && !dept.includes(q)) return false;
        }

        return true;
      })
      .map((emp) => {
        const empTasks = dateFilteredTasks.filter((t) => t.assigned_to === emp.id);
        const done = empTasks.filter((t) => t.status === "done").length;
        const inProg = empTasks.filter((t) => t.status === "in_progress").length;
        const todo = empTasks.filter((t) => t.status === "todo").length;
        const outsideWorkCount = empTasks.filter((t) => t.is_outside_work).length;

        return {
          employee: emp,
          tasks: empTasks,
          total: empTasks.length,
          done,
          inProg,
          todo,
          outsideWorkCount,
          completionRate: empTasks.length > 0 ? Math.round((done / empTasks.length) * 100) : 0,
        };
      })
      .filter((r) => r.tasks.length > 0 || !reportSearch.trim() || assigneeFilter !== "all");
  }, [employees, assigneeFilter, quickTab, currentEmployeeId, deptFilter, search, reportSearch, dateFilteredTasks]);

  return (
    <div className="space-y-5">
      <TaskReportsToolbar
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        customFrom={customFrom}
        setCustomFrom={setCustomFrom}
        customTo={customTo}
        setCustomTo={setCustomTo}
        reportSearch={reportSearch}
        setReportSearch={setReportSearch}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        departments={departments}
        dateFilteredTasks={dateFilteredTasks}
        totalEmployeesCount={employees.length}
      />

      {employeeReports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-user-search-line" />
          </div>
          <h4 className="text-sm font-bold text-gray-900">No Staff Reports Found</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No employee reports match your current search, department, priority, or assignee filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {employeeReports.map((rep) => (
            <TaskReportEmployeeCard
              key={rep.employee.id}
              rep={rep}
              activeExportMenu={activeExportMenu}
              setActiveExportMenu={setActiveExportMenu}
              onSelectTask={onSelectTask}
            />
          ))}
        </div>
      )}
    </div>
  );
});
